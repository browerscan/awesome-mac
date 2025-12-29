/**
 * API Types for Awesome Mac
 * Shared types for API requests and responses
 */

// ============================================================================
// Search API Types
// ============================================================================

export interface AppSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  isFree: boolean;
  isOpenSource: boolean;
  isAppStore: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface SearchAnalytics {
  searchId: string;
  timestamp: string;
}

export interface SearchResponse {
  q: string;
  results: AppSummary[];
  pagination: Pagination;
  suggestions?: string[];
  analytics?: SearchAnalytics;
}

export interface SearchRequest {
  q?: string;
  limit?: number;
  page?: number;
}

// ============================================================================
// Analytics API Types
// ============================================================================

export type WebVitalName = 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';

export type WebVitalRating = 'good' | 'needs-improvement' | 'poor';

export interface WebVitalMetric {
  name: WebVitalName;
  value: number;
  rating: WebVitalRating;
  delta: number;
  id: string;
  page: string;
}

export interface MetricSummary {
  count: number;
  avgValue: number;
  distribution: {
    good: number;
    needsImprovement: number;
    poor: number;
  };
}

export interface WebVitalsSummary {
  timestamp: string;
  metrics: Record<WebVitalName, MetricSummary>;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ErrorResponse {
  error: string;
  message?: string;
  code?: string;
}

export type ErrorCode =
  | 'INDEX_UNAVAILABLE'
  | 'INVALID_PARAMS'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'SERVER_ERROR';

// ============================================================================
// API Client
// ============================================================================

export class AwesomeMacAPI {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  /**
   * Search for applications
   */
  async search(params: SearchRequest = {}): Promise<SearchResponse> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.page) searchParams.set('page', String(params.page));

    const response = await fetch(`${this.baseURL}/search?${searchParams.toString()}`);

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.error || 'Search failed');
    }

    return response.json();
  }

  /**
   * Submit web vitals metric
   */
  async submitWebVital(metric: WebVitalMetric): Promise<void> {
    await fetch(`${this.baseURL}/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
    });
  }

  /**
   * Get web vitals summary (admin/debug)
   */
  async getWebVitals(): Promise<WebVitalsSummary> {
    const response = await fetch(`${this.baseURL}/vitals`);
    if (!response.ok) {
      throw new Error('Failed to fetch web vitals');
    }
    return response.json();
  }
}

// Singleton instance
export const api = new AwesomeMacAPI();
