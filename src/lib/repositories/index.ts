// ============================================
// Repository Module
// ============================================
// Unified exports for all repositories
// ============================================

export * from './BaseRepository';
export * from './AppRepository';
export * from './CategoryRepository';
export * from './AnalyticsRepository';

export { getAppRepository as appRepository } from './AppRepository';
export { getCategoryRepository as categoryRepository } from './CategoryRepository';
export { getAnalyticsRepository as analyticsRepository } from './AnalyticsRepository';

// Re-export types for convenience
export type {
  PaginationOptions,
  PaginationMeta,
  PaginatedResult,
  WhereCondition,
  OrderByCondition,
} from './BaseRepository';

export type { AppData, AppFilters, AppSearchOptions } from './AppRepository';
export type { CategoryData, CategoryWithApps, CategoryTree } from './CategoryRepository';

export type {
  AnalyticsEventData,
  WebVitalData,
  TimeSeriesData,
  AnalyticsSummary,
} from './AnalyticsRepository';
