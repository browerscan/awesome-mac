// ============================================
// Category Repository
// ============================================
// Repository for Category-related database operations
// ============================================

import { BaseRepository, WhereCondition, OrderByCondition } from './BaseRepository';

// ============================================================================
// TYPES
// ============================================================================

export interface CategoryData {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
  depth?: number;
  metadata?: Record<string, unknown>;
}

export interface CategoryWithApps extends CategoryData {
  appsCount?: number;
}

export interface CategoryTree {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId: string | null;
  sortOrder: number;
  depth: number;
  path: string[];
  pathNames: string[];
  level: number;
  children: CategoryTree[];
  appsCount?: number;
}

// ============================================================================
// CATEGORY REPOSITORY
// ============================================================================

export class CategoryRepository extends BaseRepository {
  constructor() {
    super('categories');
  }

  // ========================================================================
  // FIND OPERATIONS
  // ========================================================================

  /**
   * Find category by slug
   */
  async findBySlug(slug: string): Promise<CategoryData | null> {
    return this.findOne<CategoryData>([{ column: 'slug', operator: '=', value: slug }]);
  }

  /**
   * Find all root categories (no parent)
   */
  async findRootCategories(): Promise<CategoryData[]> {
    return this.findMany<CategoryData>([{ column: 'parent_id', operator: 'IS NULL' }], {
      orderBy: [
        { column: 'sort_order', direction: 'ASC' },
        { column: 'name', direction: 'ASC' },
      ],
    });
  }

  /**
   * Find child categories of a parent
   */
  async findChildren(parentId: string): Promise<CategoryData[]> {
    return this.findMany<CategoryData>([{ column: 'parent_id', operator: '=', value: parentId }], {
      orderBy: [
        { column: 'sort_order', direction: 'ASC' },
        { column: 'name', direction: 'ASC' },
      ],
    });
  }

  /**
   * Find categories by depth
   */
  async findByDepth(depth: number): Promise<CategoryData[]> {
    return this.findMany<CategoryData>([{ column: 'depth', operator: '=', value: depth }], {
      orderBy: [{ column: 'sort_order', direction: 'ASC' }],
    });
  }

  /**
   * Get category with apps count
   */
  async findWithAppsCount(categoryId: string): Promise<CategoryWithApps | null> {
    const query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM apps a
              WHERE a.category_id = c.id
              AND a.deleted_at IS NULL
              AND a.status = 'active') as apps_count
      FROM categories c
      WHERE c.id = $1 AND c.deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [categoryId]);
    return result.rows[0] || null;
  }

  /**
   * Get all categories with apps count
   */
  async findAllWithAppsCount(): Promise<CategoryWithApps[]> {
    const query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM apps a
              WHERE a.category_id = c.id
              AND a.deleted_at IS NULL
              AND a.status = 'active') as apps_count
      FROM categories c
      WHERE c.deleted_at IS NULL
      ORDER BY c.sort_order ASC, c.name ASC
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Get category tree (hierarchical structure)
   */
  async getTree(): Promise<CategoryTree[]> {
    const query = `
      WITH RECURSIVE category_hierarchy AS (
        -- Root categories
        SELECT
          id,
          name,
          slug,
          description,
          parent_id,
          sort_order,
          depth,
          ARRAY[id] as path,
          ARRAY[name] as path_names,
          0 as level,
          (SELECT COUNT(*) FROM apps a
           WHERE a.category_id = c.id
           AND a.deleted_at IS NULL
           AND a.status = 'active') as apps_count
        FROM categories c
        WHERE parent_id IS NULL AND deleted_at IS NULL

        UNION ALL

        -- Child categories
        SELECT
          c.id,
          c.name,
          c.slug,
          c.description,
          c.parent_id,
          c.sort_order,
          c.depth,
          ch.path || c.id,
          ch.path_names || c.name,
          ch.level + 1,
          (SELECT COUNT(*) FROM apps a
           WHERE a.category_id = c.id
           AND a.deleted_at IS NULL
           AND a.status = 'active') as apps_count
        FROM categories c
        INNER JOIN category_hierarchy ch ON c.parent_id = ch.id
        WHERE c.deleted_at IS NULL
      )
      SELECT * FROM category_hierarchy
      ORDER BY depth, sort_order, name
    `;

    const result = await this.pool.query(query);

    // Build tree structure from flat result
    const map = new Map<string, CategoryTree>();
    const roots: CategoryTree[] = [];

    // First pass: create all nodes
    for (const row of result.rows) {
      const node: CategoryTree = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        parentId: row.parent_id,
        sortOrder: row.sort_order,
        depth: row.depth,
        path: row.path,
        pathNames: row.path_names,
        level: row.level,
        appsCount: parseInt(row.apps_count || '0', 10),
        children: [],
      };
      map.set(row.id, node);
    }

    // Second pass: build tree
    for (const node of map.values()) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  /**
   * Get breadcrumb path for a category
   */
  async getBreadcrumb(categoryId: string): Promise<CategoryData[]> {
    const query = `
      WITH RECURSIVE category_path AS (
        -- Start with the category
        SELECT id, name, slug, parent_id, sort_order, depth, 0 as level
        FROM categories
        WHERE id = $1 AND deleted_at IS NULL

        UNION ALL

        -- Get parents recursively
        SELECT c.id, c.name, c.slug, c.parent_id, c.sort_order, c.depth, cp.level + 1
        FROM categories c
        INNER JOIN category_path cp ON c.id = cp.parent_id
        WHERE c.deleted_at IS NULL
      )
      SELECT * FROM category_path ORDER BY level DESC
    `;

    const result = await this.pool.query(query, [categoryId]);
    return result.rows;
  }

  // ========================================================================
  // WRITE OPERATIONS
  // ========================================================================

  /**
   * Upsert category by slug
   */
  async upsertBySlug(data: CategoryData): Promise<CategoryData> {
    const columns = ['name', 'slug', 'description', 'parent_id', 'sort_order', 'depth', 'metadata'];
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const values = [
      data.name,
      data.slug,
      data.description || null,
      data.parentId || null,
      data.sortOrder || 0,
      data.depth || 0,
      data.metadata ? JSON.stringify(data.metadata) : '{}',
    ];

    const query = `
      INSERT INTO categories (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT (slug)
      DO UPDATE SET name = EXCLUDED.name,
                  description = EXCLUDED.description,
                  parent_id = EXCLUDED.parent_id,
                  sort_order = EXCLUDED.sort_order,
                  depth = EXCLUDED.depth,
                  metadata = EXCLUDED.metadata,
                  updated_at = NOW()
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Reorder categories within a parent
   */
  async reorder(categoryIds: string[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < categoryIds.length; i++) {
        await client.query(
          'UPDATE categories SET sort_order = $1, updated_at = NOW() WHERE id = $2',
          [i, categoryIds[i]]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Move category to new parent
   */
  async move(categoryId: string, newParentId: string | null, newSortOrder?: number): Promise<void> {
    const query = `
      UPDATE categories
      SET parent_id = $1,
          sort_order = COALESCE($2, sort_order),
          depth = CASE
            WHEN $1 IS NULL THEN 0
            ELSE (SELECT depth FROM categories WHERE id = $1) + 1
          END,
          updated_at = NOW()
      WHERE id = $3
    `;
    await this.pool.query(query, [newParentId, newSortOrder, categoryId]);
  }

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  /**
   * Bulk upsert categories
   */
  async bulkUpsert(categories: CategoryData[]): Promise<void> {
    if (categories.length === 0) {
      return;
    }

    const columns = ['name', 'slug', 'description', 'parent_id', 'sort_order', 'depth', 'metadata'];

    const values = categories.map((cat) => {
      return columns
        .map((col) => {
          const key = col.replace(/_([a-z])/g, (_, c) => c.toUpperCase()) as keyof CategoryData;
          const val = cat[key];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return val;
        })
        .join(', ');
    });

    const query = `
      INSERT INTO categories (${columns.join(', ')})
      VALUES ${values.map((v) => `(${v})`).join(', ')}
      ON CONFLICT (slug)
      DO UPDATE SET name = EXCLUDED.name,
                  description = EXCLUDED.description,
                  parent_id = EXCLUDED.parent_id,
                  sort_order = EXCLUDED.sort_order,
                  depth = EXCLUDED.depth,
                  metadata = EXCLUDED.metadata,
                  updated_at = NOW()
    `;

    await this.pool.query(query);
  }

  // ========================================================================
  // CATEGORY INTEGRITY
  // ========================================================================

  /**
   * Check if category can be deleted (no children, no apps)
   */
  async canDelete(categoryId: string): Promise<{ canDelete: boolean; reason?: string }> {
    // Check for children
    const childrenResult = await this.pool.query(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = $1 AND deleted_at IS NULL',
      [categoryId]
    );
    const childrenCount = parseInt(childrenResult.rows[0].count, 10);

    if (childrenCount > 0) {
      return { canDelete: false, reason: 'Category has subcategories' };
    }

    // Check for apps
    const appsResult = await this.pool.query(
      'SELECT COUNT(*) as count FROM apps WHERE category_id = $1 AND deleted_at IS NULL',
      [categoryId]
    );
    const appsCount = parseInt(appsResult.rows[0].count, 10);

    if (appsCount > 0) {
      return { canDelete: false, reason: 'Category contains apps' };
    }

    return { canDelete: true };
  }

  /**
   * Get orphans (categories whose parent doesn't exist)
   */
  async findOrphans(): Promise<CategoryData[]> {
    const query = `
      SELECT c.*
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.parent_id IS NOT NULL
        AND p.id IS NULL
        AND c.deleted_at IS NULL
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Rebuild depth for all categories
   */
  async rebuildDepths(): Promise<void> {
    const query = `
      WITH RECURSIVE category_depths AS (
        -- Root categories have depth 0
        SELECT id, 0 as calculated_depth
        FROM categories
        WHERE parent_id IS NULL AND deleted_at IS NULL

        UNION ALL

        -- Children have parent depth + 1
        SELECT c.id, cd.calculated_depth + 1
        FROM categories c
        INNER JOIN category_depths cd ON c.parent_id = cd.id
        WHERE c.deleted_at IS NULL
      )
      UPDATE categories c
      SET depth = cd.calculated_depth, updated_at = NOW()
      FROM category_depths cd
      WHERE c.id = cd.id
        AND c.depth != cd.calculated_depth
    `;
    await this.pool.query(query);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let categoryRepositoryInstance: CategoryRepository | null = null;

export function getCategoryRepository(): CategoryRepository {
  if (!categoryRepositoryInstance) {
    categoryRepositoryInstance = new CategoryRepository();
  }
  return categoryRepositoryInstance;
}

export default getCategoryRepository;
