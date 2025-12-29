// ============================================
// App Repository
// ============================================
// Repository for App-related database operations
// ============================================

import {
  BaseRepository,
  WhereCondition,
  OrderByCondition,
  PaginatedResult,
} from './BaseRepository';

// ============================================================================
// TYPES
// ============================================================================

export interface AppData {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  url: string;
  categoryId: string;
  isFree: boolean;
  isOpenSource: boolean;
  isAppStore: boolean;
  hasAwesomeList: boolean;
  githubUrl?: string;
  appStoreUrl?: string;
  awesomeListUrl?: string;
  iconUrl?: string;
  status?: 'active' | 'deprecated' | 'removed' | 'pending';
  pricing?: 'free' | 'freemium' | 'paid' | 'open-source' | 'subscription';
  viewCount?: number;
  clickCount?: number;
  githubStars?: number;
  githubLastSyncAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface AppFilters {
  categoryId?: string;
  isFree?: boolean;
  isOpenSource?: boolean;
  isAppStore?: boolean;
  status?: string;
  search?: string;
  hasGitHubUrl?: boolean;
  minStars?: number;
}

export interface AppSearchOptions {
  filters?: AppFilters;
  orderBy?: OrderByCondition[];
  page?: number;
  limit?: number;
}

// ============================================================================
// APP REPOSITORY
// ============================================================================

export class AppRepository extends BaseRepository {
  constructor() {
    super('apps');
  }

  // ========================================================================
  // FIND OPERATIONS
  // ========================================================================

  /**
   * Find app by slug
   */
  async findBySlug(slug: string): Promise<AppData | null> {
    return this.findOne<AppData>([{ column: 'slug', operator: '=', value: slug }]);
  }

  /**
   * Find app by URL
   */
  async findByUrl(url: string): Promise<AppData | null> {
    return this.findOne<AppData>([{ column: 'url', operator: '=', value: url }]);
  }

  /**
   * Find apps by category
   */
  async findByCategory(
    categoryId: string,
    options: {
      orderBy?: OrderByCondition[];
      limit?: number;
    } = {}
  ): Promise<AppData[]> {
    return this.findMany<AppData>([{ column: 'category_id', operator: '=', value: categoryId }], {
      orderBy: options.orderBy || [{ column: 'name', direction: 'ASC' }],
      limit: options.limit,
    });
  }

  /**
   * Find apps by multiple tags
   */
  async findByTags(tagIds: string[]): Promise<AppData[]> {
    const query = `
      SELECT DISTINCT a.* FROM apps a
      INNER JOIN app_tags at ON a.id = at.app_id
      WHERE at.tag_id = ANY($1)
      AND a.deleted_at IS NULL
      ORDER BY a.name ASC
    `;
    const result = await this.pool.query(query, [tagIds]);
    return result.rows;
  }

  /**
   * Search apps with filters
   */
  async search(options: AppSearchOptions = {}): Promise<PaginatedResult<AppData>> {
    const { filters, orderBy, page, limit } = options;
    const conditions: WhereCondition[] = [];

    if (filters) {
      if (filters.categoryId) {
        conditions.push({ column: 'category_id', operator: '=', value: filters.categoryId });
      }
      if (filters.isFree !== undefined) {
        conditions.push({ column: 'is_free', operator: '=', value: filters.isFree });
      }
      if (filters.isOpenSource !== undefined) {
        conditions.push({ column: 'is_open_source', operator: '=', value: filters.isOpenSource });
      }
      if (filters.isAppStore !== undefined) {
        conditions.push({ column: 'is_app_store', operator: '=', value: filters.isAppStore });
      }
      if (filters.status) {
        conditions.push({ column: 'status', operator: '=', value: filters.status });
      }
      if (filters.hasGitHubUrl) {
        conditions.push({ column: 'github_url', operator: 'IS NOT NULL' });
      }
      if (filters.minStars) {
        conditions.push({ column: 'github_stars', operator: '>=', value: filters.minStars });
      }
      if (filters.search) {
        // Use full-text search
        const query = `
          SELECT *, ts_rank(search_vector, plainto_tsquery('english', $1)) as rank
          FROM apps
          WHERE search_vector @@ plainto_tsquery('english', $1)
          AND deleted_at IS NULL
          ORDER BY rank DESC, name ASC
          LIMIT $2 OFFSET $3
        `;
        // For search with pagination, we need a different approach
        // This is a simplified version
      }
    }

    return this.findPaginated<AppData>(conditions, {
      orderBy: orderBy || [{ column: 'name', direction: 'ASC' }],
      page,
      limit,
    });
  }

  /**
   * Full-text search using PostgreSQL tsvector
   */
  async fullTextSearch(
    query: string,
    options: {
      limit?: number;
      offset?: number;
      categoryId?: string;
    } = {}
  ): Promise<{ data: AppData[]; total: number }> {
    const { limit = 20, offset = 0, categoryId } = options;

    let whereClause = 'WHERE search_vector @@ plainto_tsquery($1) AND deleted_at IS NULL';
    const params: (string | number)[] = [query];

    if (categoryId) {
      whereClause += ' AND category_id = $2';
      params.push(categoryId);
    }

    // Get data
    const dataQuery = `
      SELECT *, ts_rank(search_vector, plainto_tsquery('english', $1)) as rank
      FROM apps
      ${whereClause}
      ORDER BY rank DESC, name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const dataResult = await this.pool.query(dataQuery, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM apps
      ${whereClause}
    `;
    const countResult = await this.pool.query(countQuery, params.slice(0, categoryId ? 2 : 1));
    const total = parseInt(countResult.rows[0].total, 10);

    return {
      data: dataResult.rows,
      total,
    };
  }

  /**
   * Fuzzy search using trigram similarity
   */
  async fuzzySearch(
    query: string,
    options: {
      limit?: number;
      threshold?: number;
    } = {}
  ): Promise<AppData[]> {
    const { limit = 20, threshold = 0.3 } = options;

    const sql = `
      SELECT *,
             similarity(name, $1) as name_similarity,
             word_similarity(name, $1) as name_word_similarity
      FROM apps
      WHERE (name % $1 OR description % $1)
        AND deleted_at IS NULL
        AND status = 'active'
      ORDER BY name_word_similarity DESC, name_similarity DESC, name ASC
      LIMIT $2
    `;

    const result = await this.pool.query(sql, [query, limit]);
    return result.rows;
  }

  // ========================================================================
  // WRITE OPERATIONS
  // ========================================================================

  /**
   * Upsert an app by URL (unique constraint)
   */
  async upsertByUrl(data: AppData): Promise<AppData> {
    const columns = [
      'name',
      'slug',
      'description',
      'url',
      'category_id',
      'is_free',
      'is_open_source',
      'is_app_store',
      'has_awesome_list',
      'github_url',
      'app_store_url',
      'awesome_list_url',
      'icon_url',
      'status',
      'pricing',
      'metadata',
    ];

    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const updateColumns = columns.filter((c) => c !== 'url' && c !== 'slug' && c !== 'created_at');
    const updateClause = updateColumns.map((col) => `${col} = EXCLUDED.${col}`).join(', ');

    const values = columns.map((col) => {
      const key = col.replace(/_([a-z])/g, (_, c) => c.toUpperCase()) as keyof AppData;
      return data[key];
    });

    const query = `
      INSERT INTO apps (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT (url)
      DO UPDATE SET ${updateClause}, updated_at = NOW()
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    const query = `
      UPDATE apps
      SET view_count = view_count + 1
      WHERE id = $1
    `;
    await this.pool.query(query, [id]);
  }

  /**
   * Increment click count
   */
  async incrementClickCount(id: string): Promise<void> {
    const query = `
      UPDATE apps
      SET click_count = click_count + 1
      WHERE id = $1
    `;
    await this.pool.query(query, [id]);
  }

  /**
   * Update GitHub metadata
   */
  async updateGitHubMetadata(
    id: string,
    metadata: {
      stars: number;
      lastSyncAt: Date;
    }
  ): Promise<void> {
    const query = `
      UPDATE apps
      SET github_stars = $1, github_last_sync_at = $2, updated_at = NOW()
      WHERE id = $3
    `;
    await this.pool.query(query, [metadata.stars, metadata.lastSyncAt, id]);
  }

  // ========================================================================
  // AGGREGATION OPERATIONS
  // ========================================================================

  /**
   * Get popular apps by view count
   */
  async getPopular(limit = 10): Promise<AppData[]> {
    return this.findMany<AppData>([], {
      orderBy: [{ column: 'view_count', direction: 'DESC' }],
      limit,
    });
  }

  /**
   * Get trending apps (recently updated with high views)
   */
  async getTrending(limit = 10): Promise<AppData[]> {
    const query = `
      SELECT *
      FROM apps
      WHERE deleted_at IS NULL
        AND status = 'active'
        AND updated_at > NOW() - INTERVAL '30 days'
      ORDER BY view_count DESC, updated_at DESC
      LIMIT $1
    `;
    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get apps count by category
   */
  async getCountByCategory(): Promise<Array<{ categoryId: string; count: number }>> {
    const query = `
      SELECT category_id, COUNT(*) as count
      FROM apps
      WHERE deleted_at IS NULL AND status = 'active'
      GROUP BY category_id
      ORDER BY count DESC
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Get stats summary
   */
  async getStats(): Promise<{
    total: number;
    free: number;
    openSource: number;
    appStore: number;
    byCategory: Array<{ categoryId: string; count: number }>;
  }> {
    const [totalResult, freeResult, openSourceResult, appStoreResult, categoryResult] =
      await Promise.all([
        this.pool.query('SELECT COUNT(*) as count FROM apps WHERE deleted_at IS NULL'),
        this.pool.query(
          'SELECT COUNT(*) as count FROM apps WHERE is_free = true AND deleted_at IS NULL'
        ),
        this.pool.query(
          'SELECT COUNT(*) as count FROM apps WHERE is_open_source = true AND deleted_at IS NULL'
        ),
        this.pool.query(
          'SELECT COUNT(*) as count FROM apps WHERE is_app_store = true AND deleted_at IS NULL'
        ),
        this.getCountByCategory(),
      ]);

    return {
      total: parseInt(totalResult.rows[0].count, 10),
      free: parseInt(freeResult.rows[0].count, 10),
      openSource: parseInt(openSourceResult.rows[0].count, 10),
      appStore: parseInt(appStoreResult.rows[0].count, 10),
      byCategory: categoryResult,
    };
  }

  /**
   * Get apps that need GitHub sync
   */
  async getAppsNeedingGithubSync(limit = 50): Promise<AppData[]> {
    const query = `
      SELECT *
      FROM apps
      WHERE is_open_source = true
        AND github_url IS NOT NULL
        AND (github_last_sync_at IS NULL
             OR github_last_sync_at < NOW() - INTERVAL '7 days')
        AND deleted_at IS NULL
        AND status = 'active'
      ORDER BY github_last_sync_at NULLS FIRST, updated_at DESC
      LIMIT $1
    `;
    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  /**
   * Bulk upsert apps by URL
   */
  async bulkUpsert(apps: AppData[]): Promise<void> {
    if (apps.length === 0) {
      return;
    }

    const columns = [
      'name',
      'slug',
      'description',
      'url',
      'category_id',
      'is_free',
      'is_open_source',
      'is_app_store',
      'has_awesome_list',
      'github_url',
      'app_store_url',
      'awesome_list_url',
      'icon_url',
      'status',
      'pricing',
      'metadata',
    ];

    const values = apps.map((app) => {
      return columns
        .map((col) => {
          const key = col.replace(/_([a-z])/g, (_, c) => c.toUpperCase()) as keyof AppData;
          const val = app[key];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (typeof val === 'boolean') return val ? 'true' : 'false';
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return val;
        })
        .join(', ');
    });

    const updateColumns = columns.filter((c) => c !== 'url' && c !== 'created_at');
    const updateClause = updateColumns.map((col) => `${col} = EXCLUDED.${col}`).join(', ');

    const query = `
      INSERT INTO apps (${columns.join(', ')})
      VALUES ${values.map((v) => `(${v})`).join(', ')}
      ON CONFLICT (url)
      DO UPDATE SET ${updateClause}, updated_at = NOW()
    `;

    await this.pool.query(query);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let appRepositoryInstance: AppRepository | null = null;

export function getAppRepository(): AppRepository {
  if (!appRepositoryInstance) {
    appRepositoryInstance = new AppRepository();
  }
  return appRepositoryInstance;
}

export default getAppRepository;
