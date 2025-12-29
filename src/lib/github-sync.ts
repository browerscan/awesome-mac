/**
 * GitHub Sync Module
 * Fetches raw content from awesome-mac repository with caching support
 */

interface CacheEntry {
  content: string;
  timestamp: number;
  etag?: string;
}

interface FetchOptions {
  forceRefresh?: boolean;
  language?: 'en' | 'zh';
}

interface CacheConfig {
  maxAge: number; // milliseconds
  staleWhileRevalidate: number; // milliseconds
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxAge: 5 * 60 * 1000, // 5 minutes
  staleWhileRevalidate: 60 * 60 * 1000, // 1 hour
};

const README_URLS = {
  en: 'https://raw.githubusercontent.com/jaywcjlove/awesome-mac/master/README.md',
  zh: 'https://raw.githubusercontent.com/jaywcjlove/awesome-mac/master/README-zh.md',
} as const;

// In-memory cache store
const cache: Map<string, CacheEntry> = new Map();

// Pending requests to prevent duplicate fetches
const pendingRequests: Map<string, Promise<string>> = new Map();

/**
 * Check if cached content is still fresh
 */
function isCacheFresh(entry: CacheEntry, config: CacheConfig): boolean {
  const age = Date.now() - entry.timestamp;
  return age < config.maxAge;
}

/**
 * Check if cached content can still be served while revalidating
 */
function isCacheStaleButServable(entry: CacheEntry, config: CacheConfig): boolean {
  const age = Date.now() - entry.timestamp;
  return age < config.staleWhileRevalidate;
}

/**
 * Fetch content from GitHub with error handling
 */
async function fetchFromGitHub(
  url: string,
  etag?: string
): Promise<{ content: string; etag?: string; notModified: boolean }> {
  const token = process.env.GITHUB_TOKEN;
  const headers: HeadersInit = {
    Accept: 'text/plain',
    'User-Agent': 'Awesome-Mac-Navigator-Engine/1.0',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (etag) {
    headers['If-None-Match'] = etag;
  }

  const response = await fetch(url, { headers });

  if (response.status === 304) {
    return { content: '', etag, notModified: true };
  }

  if (!response.ok) {
    throw new GitHubFetchError(
      `Failed to fetch README: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  const content = await response.text();
  const newEtag = response.headers.get('etag') || undefined;

  return { content, etag: newEtag, notModified: false };
}

/**
 * Custom error class for GitHub fetch errors
 */
export class GitHubFetchError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'GitHubFetchError';
  }
}

/**
 * Fetch the raw README markdown content from GitHub
 * Implements stale-while-revalidate caching pattern
 *
 * @param options - Fetch options including forceRefresh and language
 * @returns Promise resolving to the raw markdown content
 */
export async function fetchReadme(options: FetchOptions = {}): Promise<string> {
  const { forceRefresh = false, language = 'zh' } = options;
  const url = README_URLS[language];
  const cacheKey = `readme-${language}`;

  // Check if there's a pending request for the same content
  const pending = pendingRequests.get(cacheKey);
  if (pending && !forceRefresh) {
    return pending;
  }

  const cachedEntry = cache.get(cacheKey);

  // If cache is fresh and not forcing refresh, return cached content
  if (cachedEntry && isCacheFresh(cachedEntry, DEFAULT_CACHE_CONFIG) && !forceRefresh) {
    return cachedEntry.content;
  }

  // Create the fetch promise
  const fetchPromise = (async (): Promise<string> => {
    try {
      // If cache is stale but servable, revalidate in background
      if (
        cachedEntry &&
        isCacheStaleButServable(cachedEntry, DEFAULT_CACHE_CONFIG) &&
        !forceRefresh
      ) {
        // Serve stale content immediately
        // Trigger background revalidation
        revalidateInBackground(url, cacheKey, cachedEntry.etag);
        return cachedEntry.content;
      }

      // Fetch fresh content
      const result = await fetchFromGitHub(url, cachedEntry?.etag);

      if (result.notModified && cachedEntry) {
        // Update timestamp but keep content
        cache.set(cacheKey, {
          ...cachedEntry,
          timestamp: Date.now(),
        });
        return cachedEntry.content;
      }

      // Store new content in cache
      cache.set(cacheKey, {
        content: result.content,
        timestamp: Date.now(),
        etag: result.etag,
      });

      return result.content;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Revalidate cache in background without blocking
 */
async function revalidateInBackground(url: string, cacheKey: string, etag?: string): Promise<void> {
  try {
    const result = await fetchFromGitHub(url, etag);

    if (!result.notModified) {
      cache.set(cacheKey, {
        content: result.content,
        timestamp: Date.now(),
        etag: result.etag,
      });
    } else {
      const existing = cache.get(cacheKey);
      if (existing) {
        cache.set(cacheKey, {
          ...existing,
          timestamp: Date.now(),
        });
      }
    }
  } catch (error) {
    // Silent failure for background revalidation
    console.warn('Background revalidation failed:', error);
  }
}

/**
 * Clear the cache for a specific language or all caches
 */
export function clearCache(language?: 'en' | 'zh'): void {
  if (language) {
    cache.delete(`readme-${language}`);
  } else {
    cache.clear();
  }
}

/**
 * Get cache status for debugging/monitoring
 */
export function getCacheStatus(language: 'en' | 'zh' = 'zh'): {
  exists: boolean;
  age: number | null;
  isFresh: boolean;
  isStale: boolean;
} {
  const cacheKey = `readme-${language}`;
  const entry = cache.get(cacheKey);

  if (!entry) {
    return {
      exists: false,
      age: null,
      isFresh: false,
      isStale: false,
    };
  }

  const age = Date.now() - entry.timestamp;

  return {
    exists: true,
    age,
    isFresh: isCacheFresh(entry, DEFAULT_CACHE_CONFIG),
    isStale:
      !isCacheFresh(entry, DEFAULT_CACHE_CONFIG) &&
      isCacheStaleButServable(entry, DEFAULT_CACHE_CONFIG),
  };
}
