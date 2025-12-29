// ============================================
// Analytics Repository
// ============================================
// Repository for Analytics-related database operations
// ============================================

import { BaseRepository, WhereCondition, OrderByCondition } from './BaseRepository';

// ============================================================================
// TYPES
// ============================================================================

export interface AnalyticsEventData {
  id?: string;
  eventType: 'view' | 'click' | 'search' | 'filter';
  appId?: string;
  categoryId?: string;
  sessionId?: string;
  userAgent?: string;
  referrer?: string;
  ipAddress?: string;
  countryCode?: string;
  searchQuery?: string;
  searchResultsCount?: number;
  filterData?: Record<string, unknown>;
  dateBucket?: Date;
}

export interface WebVitalData {
  id?: string;
  metricName: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  delta: number;
  metricId: string;
  page: string;
  sessionId?: string;
  userAgent?: string;
  connectionType?: string;
}

export interface TimeSeriesData {
  date: string;
  count: number;
  uniqueApps?: number;
  uniqueSessions?: number;
}

export interface AnalyticsSummary {
  totalEvents: number;
  byEventType: Record<string, number>;
  byApp: Array<{ appId: string; appName: string; count: number }>;
  byCategory: Array<{ categoryId: string; categoryName: string; count: number }>;
  topSearches: Array<{ query: string; count: number }>;
  timeSeries: TimeSeriesData[];
}

// ============================================================================
// ANALYTICS REPOSITORY
// ============================================================================

export class AnalyticsRepository extends BaseRepository {
  constructor() {
    super('analytics_events');
  }

  // ========================================================================
  // EVENT TRACKING
  // ========================================================================

  /**
   * Track a view event
   */
  async trackView(data: {
    appId: string;
    categoryId?: string;
    sessionId?: string;
    userAgent?: string;
    referrer?: string;
    ipAddress?: string;
    countryCode?: string;
  }): Promise<void> {
    const query = `
      INSERT INTO analytics_events (
        event_type, app_id, category_id, session_id, user_agent,
        referrer, ip_address, country_code, date_bucket
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE)
    `;

    await this.pool.query(query, [
      'view',
      data.appId,
      data.categoryId || null,
      data.sessionId || null,
      data.userAgent || null,
      data.referrer || null,
      data.ipAddress || null,
      data.countryCode || null,
    ]);
  }

  /**
   * Track a click event
   */
  async trackClick(data: {
    appId: string;
    categoryId?: string;
    sessionId?: string;
    userAgent?: string;
    referrer?: string;
  }): Promise<void> {
    const query = `
      INSERT INTO analytics_events (
        event_type, app_id, category_id, session_id, user_agent,
        referrer, date_bucket
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
    `;

    await this.pool.query(query, [
      'click',
      data.appId,
      data.categoryId || null,
      data.sessionId || null,
      data.userAgent || null,
      data.referrer || null,
    ]);
  }

  /**
   * Track a search event
   */
  async trackSearch(data: {
    query: string;
    resultsCount: number;
    sessionId?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<void> {
    const query = `
      INSERT INTO analytics_events (
        event_type, search_query, search_results_count, session_id,
        user_agent, ip_address, date_bucket
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
    `;

    await this.pool.query(query, [
      'search',
      data.query,
      data.resultsCount,
      data.sessionId || null,
      data.userAgent || null,
      data.ipAddress || null,
    ]);
  }

  /**
   * Track a filter event
   */
  async trackFilter(data: {
    categoryId?: string;
    filters: Record<string, unknown>;
    resultsCount: number;
    sessionId?: string;
    userAgent?: string;
  }): Promise<void> {
    const query = `
      INSERT INTO analytics_events (
        event_type, category_id, filter_data, search_results_count,
        session_id, user_agent, date_bucket
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
    `;

    await this.pool.query(query, [
      'filter',
      data.categoryId || null,
      JSON.stringify(data.filters),
      data.resultsCount,
      data.sessionId || null,
      data.userAgent || null,
    ]);
  }

  // ========================================================================
  // WEB VITALS
  // ========================================================================

  /**
   * Record a web vital metric
   */
  async recordWebVital(data: WebVitalData): Promise<void> {
    const query = `
      INSERT INTO web_vitals (
        metric_name, value, rating, delta, metric_id, page,
        session_id, user_agent, connection_type, date_bucket
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE)
    `;

    await this.pool.query(query, [
      data.metricName,
      data.value,
      data.rating,
      data.delta,
      data.metricId,
      data.page,
      data.sessionId || null,
      data.userAgent || null,
      data.connectionType || null,
    ]);
  }

  /**
   * Get web vitals summary
   */
  async getWebVitalsSummary(
    days = 30
  ): Promise<
    Record<string, { count: number; avgValue: number; distribution: Record<string, number> }>
  > {
    const query = `
      SELECT
        metric_name,
        COUNT(*) as count,
        AVG(value) as avg_value,
        rating,
        COUNT(*) as rating_count
      FROM web_vitals
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY metric_name, rating
      ORDER BY metric_name, rating
    `;

    const result = await this.pool.query(query);

    const summary: Record<
      string,
      { count: number; avgValue: number; distribution: Record<string, number> }
    > = {};

    for (const row of result.rows) {
      const metric = row.metric_name;

      if (!summary[metric]) {
        summary[metric] = {
          count: 0,
          avgValue: parseFloat(row.avg_value),
          distribution: {},
        };
      }

      summary[metric].count += parseInt(row.rating_count, 10);
      summary[metric].distribution[row.rating] = parseInt(row.rating_count, 10);
    }

    return summary;
  }

  // ========================================================================
  // ANALYTICS QUERIES
  // ========================================================================

  /**
   * Get event counts by type
   */
  async getEventCounts(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ eventType: string; count: number }>> {
    const query = `
      SELECT event_type, COUNT(*) as count
      FROM analytics_events
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY event_type
      ORDER BY count DESC
    `;

    const result = await this.pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  /**
   * Get time series data for charts
   */
  async getTimeSeries(
    eventType: string | null,
    days = 30,
    granularity: 'day' | 'hour' = 'day'
  ): Promise<TimeSeriesData[]> {
    const truncate = granularity === 'day' ? 'day' : 'hour';

    let eventTypeFilter = '';
    const params: (string | number)[] = [days];

    if (eventType) {
      eventTypeFilter = 'AND event_type = $2';
      params.push(eventType);
    }

    const query = `
      SELECT
        DATE_TRUNC('${truncate}', created_at)::date as date,
        COUNT(*) as count,
        COUNT(DISTINCT app_id) as unique_apps,
        COUNT(DISTINCT session_id) as unique_sessions
      FROM analytics_events
      WHERE created_at > NOW() - INTERVAL '$1 days'
        ${eventTypeFilter}
      GROUP BY DATE_TRUNC('${truncate}', created_at)
      ORDER BY date ASC
    `;

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      count: parseInt(row.count, 10),
      uniqueApps: row.unique_apps ? parseInt(row.unique_apps, 10) : undefined,
      uniqueSessions: row.unique_sessions ? parseInt(row.unique_sessions, 10) : undefined,
    }));
  }

  /**
   * Get top apps by views
   */
  async getTopApps(
    limit = 10,
    days = 30
  ): Promise<Array<{ appId: string; appName: string; count: number }>> {
    const query = `
      SELECT
        a.id as app_id,
        a.name as app_name,
        COUNT(*) as count
      FROM analytics_events e
      INNER JOIN apps a ON e.app_id = a.id
      WHERE e.event_type = 'view'
        AND e.created_at > NOW() - INTERVAL '${days} days'
      GROUP BY a.id, a.name
      ORDER BY count DESC
      LIMIT $1
    `;

    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get top search queries
   */
  async getTopSearches(limit = 10, days = 30): Promise<Array<{ query: string; count: number }>> {
    const query = `
      SELECT
        search_query as query,
        COUNT(*) as count
      FROM analytics_events
      WHERE event_type = 'search'
        AND search_query IS NOT NULL
        AND created_at > NOW() - INTERVAL '${days} days'
      GROUP BY search_query
      ORDER BY count DESC
      LIMIT $1
    `;

    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get analytics summary for dashboard
   */
  async getSummary(days = 30): Promise<AnalyticsSummary> {
    const [eventCounts, topApps, topSearches, timeSeries] = await Promise.all([
      this.getEventCounts(new Date(Date.now() - days * 24 * 60 * 60 * 1000), new Date()),
      this.getTopApps(10, days),
      this.getTopSearches(10, days),
      this.getTimeSeries(null, days, 'day'),
    ]);

    const totalEvents = eventCounts.reduce((sum, row) => sum + row.count, 0);
    const byEventType: Record<string, number> = {};
    for (const row of eventCounts) {
      byEventType[row.eventType] = row.count;
    }

    return {
      totalEvents,
      byEventType,
      byApp: topApps,
      byCategory: [], // Can be implemented if needed
      topSearches: topSearches,
      timeSeries,
    };
  }

  // ========================================================================
  // DATA RETENTION
  // ========================================================================

  /**
   * Delete old analytics data (for GDPR/compliance)
   */
  async deleteOldData(olderThanDays = 365): Promise<number> {
    const query = `
      DELETE FROM analytics_events
      WHERE created_at < NOW() - INTERVAL '${olderThanDays} days'
      RETURNING id
    `;

    const result = await this.pool.query(query);
    return result.rowCount || 0;
  }

  /**
   * Aggregate old data into summary tables (optional optimization)
   */
  async aggregateOldData(olderThanDays = 90): Promise<void> {
    // This could store aggregated data in a separate table
    // and delete the raw detailed data to save space
    // Implementation depends on specific requirements
  }

  // ========================================================================
  // SESSION ANALYTICS
  // ========================================================================

  /**
   * Get session details
   */
  async getSessionEvents(sessionId: string): Promise<AnalyticsEventData[]> {
    const query = `
      SELECT * FROM analytics_events
      WHERE session_id = $1
      ORDER BY created_at ASC
    `;

    const result = await this.pool.query(query, [sessionId]);
    return result.rows;
  }

  /**
   * Get session stats
   */
  async getSessionStats(sessionId: string): Promise<{
    duration: number;
    eventCount: number;
    uniqueAppsViewed: number;
    searchesPerformed: number;
  }> {
    const query = `
      SELECT
        EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as duration,
        COUNT(*) as event_count,
        COUNT(DISTINCT app_id) as unique_apps_viewed,
        COUNT(*) FILTER (WHERE event_type = 'search') as searches_performed
      FROM analytics_events
      WHERE session_id = $1
    `;

    const result = await this.pool.query(query, [sessionId]);
    const row = result.rows[0];

    return {
      duration: Math.round(parseFloat(row.duration || '0')),
      eventCount: parseInt(row.event_count, 10),
      uniqueAppsViewed: parseInt(row.unique_apps_viewed, 10),
      searchesPerformed: parseInt(row.searches_performed, 10),
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let analyticsRepositoryInstance: AnalyticsRepository | null = null;

export function getAnalyticsRepository(): AnalyticsRepository {
  if (!analyticsRepositoryInstance) {
    analyticsRepositoryInstance = new AnalyticsRepository();
  }
  return analyticsRepositoryInstance;
}

export default getAnalyticsRepository;
