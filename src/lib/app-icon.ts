/**
 * App Icon Fetching and Caching Utility
 *
 * This module handles fetching app icons from multiple sources:
 * 1. App Store Search API (iTunes API)
 * 2. GitHub repository owner avatars (for OSS apps)
 * 3. Domain favicons (fallback)
 */

import { App } from '@/types';

// Cache for icon URLs
const iconCache = new Map<string, string>();
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

interface iTunesSearchResult {
  resultCount: number;
  results: Array<{
    artworkUrl512?: string;
    artworkUrl100?: string;
    artworkUrl60?: string;
    trackViewUrl?: string;
  }>;
}

interface GitHubRepoResult {
  owner: {
    avatar_url?: string;
    login?: string;
  };
}

/**
 * Extract GitHub owner/repo from a GitHub URL
 */
export function extractGitHubInfo(url: string): { owner: string; repo: string } | null {
  const githubRegex = /github\.com\/([^/]+)\/([^/]+)/;
  const match = url.match(githubRegex);
  if (match && match[1] && match[2]) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
}

/**
 * Extract domain from a URL
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Extract App Store ID from an App Store URL
 */
export function extractAppStoreId(url: string): string | null {
  const patterns = [/id(\d+)/, /\/app\/[^/]+\/id(\d+)/];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Search iTunes API for an app by name
 */
async function searchITunesApi(appName: string): Promise<string | null> {
  try {
    const encodedName = encodeURIComponent(appName + ' mac');
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodedName}&entity=macSoftware&limit=1`,
      {
        next: { revalidate: CACHE_DURATION / 1000 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      return null;
    }

    const data: iTunesSearchResult = await response.json();

    if (data.resultCount > 0 && data.results[0]) {
      const app = data.results[0];
      // Prefer highest resolution, fallback to lower
      return app.artworkUrl512 || app.artworkUrl100 || app.artworkUrl60 || null;
    }
  } catch {
    // Silently fail on API errors
  }
  return null;
}

/**
 * Get GitHub owner avatar URL
 */
async function getGitHubAvatar(githubUrl: string): Promise<string | null> {
  const githubInfo = extractGitHubInfo(githubUrl);
  if (!githubInfo) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${githubInfo.owner}/${githubInfo.repo}`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
        next: { revalidate: CACHE_DURATION / 1000 },
      }
    );

    if (!response.ok) {
      // Fall back to GitHub's avatar URL pattern
      return `https://github.com/${githubInfo.owner}.png`;
    }

    const data: GitHubRepoResult = await response.json();
    return data.owner?.avatar_url || `https://github.com/${githubInfo.owner}.png`;
  } catch {
    // Fall back to GitHub's avatar URL pattern
    return `https://github.com/${githubInfo.owner}.png`;
  }
}

/**
 * Get favicon from Google's favicon service
 */
function getFaviconUrl(url: string): string {
  const domain = extractDomain(url);
  if (!domain) {
    return '';
  }
  // Use Google's favicon service as a reliable fallback
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

/**
 * Get app icon URL with caching
 */
export async function getAppIconUrl(
  app: Pick<App, 'name' | 'url' | 'isOpenSource' | 'ossUrl' | 'appStoreUrl'>
): Promise<string> {
  // Check cache first
  const cacheKey = `${app.name}-${app.url}`;
  const cached = iconCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let iconUrl = '';

  // Try 1: If there's an App Store URL, try to fetch from iTunes API
  if (app.appStoreUrl) {
    const appStoreId = extractAppStoreId(app.appStoreUrl);
    if (appStoreId) {
      // Use iTunes API artwork URL pattern directly
      iconUrl = `https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/${appStoreId.substring(0, 4)}/${appStoreId.substring(4, 8)}/${appStoreId}/source/512x512bb.jpg`;
    }
  }

  // Try 2: If no App Store icon and it's open source, try GitHub avatar
  if (!iconUrl && app.isOpenSource && app.ossUrl) {
    const githubAvatar = await getGitHubAvatar(app.ossUrl);
    if (githubAvatar) iconUrl = githubAvatar;
  }

  // Try 3: Search iTunes API by app name (last resort for Mac apps)
  if (!iconUrl) {
    const itunesIcon = await searchITunesApi(app.name);
    if (itunesIcon) iconUrl = itunesIcon;
  }

  // Fallback: Use domain favicon
  if (!iconUrl) {
    iconUrl = getFaviconUrl(app.url);
  }

  // Cache the result
  if (iconUrl) {
    iconCache.set(cacheKey, iconUrl);
  }

  return iconUrl || '';
}

/**
 * Get a generic fallback icon based on app name
 */
export function getFallbackIcon(name: string): string {
  return name.charAt(0).toUpperCase();
}

/**
 * Generate initials for avatar
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Generate a gradient color based on the app name
 */
export function getGradientColor(name: string): string {
  const colors = [
    ['from-blue-500', 'to-purple-600'],
    ['from-green-500', 'to-teal-600'],
    ['from-purple-500', 'to-pink-600'],
    ['from-orange-500', 'to-red-600'],
    ['from-cyan-500', 'to-blue-600'],
    ['from-pink-500', 'to-rose-600'],
    ['from-indigo-500', 'to-purple-600'],
    ['from-yellow-500', 'to-orange-600'],
  ];

  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length].join(' ');
}
