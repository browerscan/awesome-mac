import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAllApps } from '@/lib/data';
import { createSearchIndex } from '@/lib/search';
import type { App } from '@/types';
import fs from 'fs/promises';
import path from 'path';
import {
  rateLimiters,
  getClientIp,
  createRateLimitResponse,
  setRateLimitHeaders,
} from '@/lib/rate-limit';
import { ValidationError, createErrorResponse, sanitizeSearchQuery } from '@/lib/validation';
import { applyCorsHeaders } from '@/lib/cors';
import { applySecurityHeaders } from '@/lib/security-headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SearchResultItem = Pick<
  App,
  | 'id'
  | 'slug'
  | 'name'
  | 'description'
  | 'categoryId'
  | 'categoryName'
  | 'isFree'
  | 'isOpenSource'
  | 'isAppStore'
>;

interface SearchResponse {
  q: string;
  results: SearchResultItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  suggestions?: string[];
  analytics?: {
    searchId: string;
    timestamp: string;
  };
}

interface ErrorResponse {
  error: string;
  message?: string;
  code: string;
}

let cached: {
  mtimeMs: number;
  index: ReturnType<typeof createSearchIndex>;
  appsById: Map<string, SearchResultItem>;
  allApps: SearchResultItem[];
} | null = null;

async function getDistMtimeMs(): Promise<number> {
  const filePath = path.join(process.cwd(), 'dist', 'awesome-mac.json');
  try {
    const stat = await fs.stat(filePath);
    return stat.mtimeMs;
  } catch (err) {
    throw new Error(
      `Missing dist/awesome-mac.json. Run \`npm run build:data\` first. (${String(err)})`
    );
  }
}

async function getIndex() {
  const mtimeMs = await getDistMtimeMs();
  if (cached?.mtimeMs === mtimeMs) return cached;

  const apps = await getAllApps();
  const slimApps: SearchResultItem[] = apps.map((app) => ({
    id: app.id,
    slug: app.slug,
    name: app.name,
    description: app.description,
    categoryId: app.categoryId,
    categoryName: app.categoryName,
    isFree: app.isFree,
    isOpenSource: app.isOpenSource,
    isAppStore: app.isAppStore,
  }));

  const index = createSearchIndex(slimApps as unknown as App[]);
  const appsById = new Map<string, SearchResultItem>(slimApps.map((app) => [app.id, app]));

  cached = { mtimeMs, index, appsById, allApps: slimApps };
  return cached;
}

// Generate suggestions based on partial matches
function generateSuggestions(
  allApps: SearchResultItem[],
  query: string,
  limit: number = 5
): string[] {
  if (!query || query.length < 2) return [];

  const queryLower = query.toLowerCase();
  const suggestions = new Set<string>();

  // Exact name starts with query
  for (const app of allApps) {
    if (app.name.toLowerCase().startsWith(queryLower)) {
      suggestions.add(app.name);
      if (suggestions.size >= limit) break;
    }
  }

  // Name contains query
  if (suggestions.size < limit) {
    for (const app of allApps) {
      if (app.name.toLowerCase().includes(queryLower) && !suggestions.has(app.name)) {
        suggestions.add(app.name);
        if (suggestions.size >= limit) break;
      }
    }
  }

  // Category suggestions
  if (suggestions.size < limit) {
    const categories = new Set<string>();
    for (const app of allApps) {
      if (app.categoryName.toLowerCase().includes(queryLower)) {
        categories.add(app.categoryName);
      }
    }
    for (const cat of categories) {
      suggestions.add(cat);
      if (suggestions.size >= limit) break;
    }
  }

  return Array.from(suggestions);
}

// Track search analytics
function trackSearch(query: string, resultsCount: number, searchId: string): void {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA_MEASUREMENT_PROTOCOL_SECRET;

  if (!measurementId || !apiSecret) return;

  // Use fetch without await for fire-and-forget
  fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
    {
      method: 'POST',
      body: JSON.stringify({
        client_id: searchId,
        events: [
          {
            name: 'search',
            params: {
              search_term: query,
              results_count: resultsCount,
              engagement_time_msec: 100,
            },
          },
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    }
  ).catch((err) => {
    // Silently fail to not affect user experience
    console.error('[search] Analytics error:', err);
  });
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  applyCorsHeaders(req, response);
  applySecurityHeaders(response);
  return response;
}

export async function GET(req: NextRequest) {
  // Apply CORS headers
  const response = NextResponse.json<SearchResponse>({
    q: '',
    results: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      hasMore: false,
    },
  });
  applyCorsHeaders(req, response);
  applySecurityHeaders(response);

  // Rate limiting check
  const clientId = getClientIp(req);
  const rateLimitResult = await rateLimiters.search.check(clientId);

  if (!rateLimitResult.success) {
    const rateLimitResponse = createRateLimitResponse(rateLimitResult);
    applyCorsHeaders(req, rateLimitResponse);
    applySecurityHeaders(rateLimitResponse);
    return rateLimitResponse;
  }

  // Validate and sanitize input
  try {
    const { searchParams } = new URL(req.url);

    // Sanitize query first for basic safety
    const rawQuery = (searchParams.get('q') || '').trim();
    const sanitizedQuery = sanitizeSearchQuery(rawQuery);

    // Pagination parameters with validation
    const pageRaw = Number(searchParams.get('page') || '1');
    const page = Number.isFinite(pageRaw)
      ? Math.max(1, Math.min(Math.floor(pageRaw), 100)) // Max 100 pages
      : 1;
    const limitRaw = Number(searchParams.get('limit') || '10');
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 50) : 10;

    // Generate unique search ID for analytics
    const searchId = crypto.randomUUID();

    // Handle empty query - return empty results
    if (!sanitizedQuery) {
      setRateLimitHeaders(response, rateLimitResult);
      response.headers.set('X-Search-ID', searchId);
      return response;
    }

    let indexData;
    try {
      indexData = await getIndex();
    } catch (err) {
      const errorResponse: ErrorResponse = {
        error: 'Search index unavailable',
        message: 'The search index is currently being updated. Please try again later.',
        code: 'INDEX_UNAVAILABLE',
      };
      const errorResp = NextResponse.json(errorResponse, {
        status: 503,
        headers: {
          'Retry-After': '60', // Suggest retry after 60 seconds
        },
      });
      applyCorsHeaders(req, errorResp);
      applySecurityHeaders(errorResp);
      return errorResp;
    }

    const { index, appsById, allApps } = indexData;

    // Get all matching results (for pagination)
    const searchLimit = 250; // Maximum results to consider
    const allMatches = index.search(sanitizedQuery, searchLimit).map((r) => appsById.get(r.app.id));
    const totalResults = allMatches.filter(Boolean).length;

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = allMatches.slice(startIndex, endIndex).filter(Boolean);

    // Generate suggestions if no results or limited results
    const suggestions =
      totalResults === 0 ? generateSuggestions(allApps, sanitizedQuery, 5) : undefined;

    // Track search analytics in production
    if (process.env.NODE_ENV === 'production') {
      // Non-blocking analytics
      trackSearch(sanitizedQuery, totalResults, searchId);
    }

    const successResponse = NextResponse.json<SearchResponse>({
      q: sanitizedQuery,
      results: paginatedResults as SearchResultItem[],
      pagination: {
        page,
        limit,
        total: totalResults,
        hasMore: endIndex < totalResults,
      },
      suggestions,
      analytics: {
        searchId,
        timestamp: new Date().toISOString(),
      },
    });

    applyCorsHeaders(req, successResponse);
    applySecurityHeaders(successResponse);
    setRateLimitHeaders(successResponse, rateLimitResult);
    successResponse.headers.set('X-Search-ID', searchId);

    return successResponse;
  } catch (error) {
    if (error instanceof ValidationError) {
      const errorResponse = createErrorResponse(error, 400);
      applyCorsHeaders(req, errorResponse);
      applySecurityHeaders(errorResponse);
      return errorResponse;
    }

    // Unknown error - don't leak details
    const errorResponse = NextResponse.json<ErrorResponse>(
      {
        error: 'Invalid request',
        code: 'INVALID_REQUEST',
      },
      { status: 400 }
    );
    applyCorsHeaders(req, errorResponse);
    applySecurityHeaders(errorResponse);
    return errorResponse;
  }
}
