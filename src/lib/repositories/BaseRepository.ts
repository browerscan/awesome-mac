// ============================================
// Base Repository
// ============================================
// Abstract base class for all repositories
// Provides common CRUD operations and database utilities
// ============================================

import { getPool } from '@/db/config';

// ============================================================================
// TYPES
// ============================================================================

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface WhereCondition {
  column: string;
  operator?:
    | '='
    | '!='
    | '>'
    | '<'
    | '>='
    | '<='
    | 'LIKE'
    | 'ILIKE'
    | 'IN'
    | 'IS NULL'
    | 'IS NOT NULL';
  value?: unknown;
  values?: unknown[];
}

export interface OrderByCondition {
  column: string;
  direction?: 'ASC' | 'DESC';
}

// ============================================================================
// BASE REPOSITORY
// ============================================================================

export abstract class BaseRepository {
  protected tableName: string;
  protected pool = getPool();

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // ========================================================================
  // QUERY BUILDERS
  // ========================================================================

  /**
   * Build WHERE clause from conditions
   */
  protected buildWhereClause(conditions: WhereCondition[]): {
    clause: string;
    params: unknown[];
  } {
    if (conditions.length === 0) {
      return { clause: '', params: [] };
    }

    const clauses: string[] = [];
    const params: unknown[] = [];

    for (const condition of conditions) {
      const { column, operator = '=', value, values } = condition;

      if (operator === 'IS NULL') {
        clauses.push(`${column} IS NULL`);
      } else if (operator === 'IS NOT NULL') {
        clauses.push(`${column} IS NOT NULL`);
      } else if (operator === 'IN' && values) {
        const placeholders = values.map((_, i) => `$${params.length + i + 1}`).join(', ');
        clauses.push(`${column} IN (${placeholders})`);
        params.push(...values);
      } else if (operator === 'LIKE' || operator === 'ILIKE') {
        clauses.push(`${column} ${operator} $${params.length + 1}`);
        params.push(value);
      } else {
        clauses.push(`${column} ${operator} $${params.length + 1}`);
        params.push(value);
      }
    }

    return { clause: `WHERE ${clauses.join(' AND ')}`, params };
  }

  /**
   * Build ORDER BY clause
   */
  protected buildOrderByClause(orderBy: OrderByCondition[]): string {
    if (orderBy.length === 0) {
      return '';
    }

    const clauses = orderBy.map((o) => `${o.column} ${o.direction || 'ASC'}`);

    return `ORDER BY ${clauses.join(', ')}`;
  }

  // ========================================================================
  // COMMON CRUD OPERATIONS
  // ========================================================================

  /**
   * Find a single record by ID
   */
  async findById<T>(id: string, columns = '*'): Promise<T | null> {
    const query = `SELECT ${columns} FROM ${this.tableName} WHERE id = $1 AND deleted_at IS NULL`;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find a single record by conditions
   */
  async findOne<T>(conditions: WhereCondition[], columns = '*'): Promise<T | null> {
    const { clause, params } = this.buildWhereClause(conditions);
    const query = `SELECT ${columns} FROM ${this.tableName} ${clause} AND deleted_at IS NULL LIMIT 1`;
    const result = await this.pool.query(query, params);
    return result.rows[0] || null;
  }

  /**
   * Find all records matching conditions
   */
  async findMany<T>(
    conditions: WhereCondition[] = [],
    options: {
      columns?: string;
      orderBy?: OrderByCondition[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<T[]> {
    const { columns = '*', orderBy, limit, offset } = options;
    const { clause, params } = this.buildWhereClause([
      ...conditions,
      {
        column: 'deleted_at',
        operator: 'IS NULL',
      },
    ]);

    let query = `SELECT ${columns} FROM ${this.tableName} ${clause}`;
    query += this.buildOrderByClause(orderBy || []);

    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }

    if (offset) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(offset);
    }

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Find records with pagination
   */
  async findPaginated<T>(
    conditions: WhereCondition[] = [],
    options: {
      columns?: string;
      orderBy?: OrderByCondition[];
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResult<T>> {
    const { columns = '*', orderBy, page = 1, limit = 20 } = options;

    // Get total count
    const { clause: whereClause, params: countParams } = this.buildWhereClause([
      ...conditions,
      { column: 'deleted_at', operator: 'IS NULL' },
    ]);
    const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
    const countResult = await this.pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated data
    const offset = (page - 1) * limit;
    const { clause, params } = this.buildWhereClause([
      ...conditions,
      { column: 'deleted_at', operator: 'IS NULL' },
    ]);

    let query = `SELECT ${columns} FROM ${this.tableName} ${clause}`;
    query += this.buildOrderByClause(orderBy || []);
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await this.pool.query(query, params);

    return {
      data: result.rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Create a new record
   */
  async create<T>(data: Record<string, unknown>): Promise<T> {
    const columns = Object.keys(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(data);

    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Create multiple records
   */
  async createMany<T>(dataArray: Record<string, unknown>[]): Promise<T[]> {
    if (dataArray.length === 0) {
      return [];
    }

    const columns = Object.keys(dataArray[0]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const queries = dataArray
      .map((data) => {
        const values = columns.map((col) => data[col]);
        return `(${placeholders})`;
      })
      .join(', ');

    const flatValues = dataArray.flatMap((data) => columns.map((col) => data[col]));

    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES ${queries}
      RETURNING *
    `;

    const result = await this.pool.query(query, flatValues);
    return result.rows;
  }

  /**
   * Update a record by ID
   */
  async update<T>(id: string, data: Record<string, unknown>): Promise<T | null> {
    const columns = Object.keys(data);
    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    const values = [...Object.values(data), id];

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Soft delete a record by ID
   */
  async softDelete(id: string): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName}
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `;

    const result = await this.pool.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Permanently delete a record by ID
   */
  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`;
    const result = await this.pool.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Count records matching conditions
   */
  async count(conditions: WhereCondition[] = []): Promise<number> {
    const { clause, params } = this.buildWhereClause([
      ...conditions,
      { column: 'deleted_at', operator: 'IS NULL' },
    ]);

    const query = `SELECT COUNT(*) as count FROM ${this.tableName} ${clause}`;
    const result = await this.pool.query(query, params);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Check if a record exists
   */
  async exists(conditions: WhereCondition[]): Promise<boolean> {
    const { clause, params } = this.buildWhereClause([
      ...conditions,
      { column: 'deleted_at', operator: 'IS NULL' },
    ]);

    const query = `SELECT EXISTS(SELECT 1 FROM ${this.tableName} ${clause}) as exists`;
    const result = await this.pool.query(query, params);
    return result.rows[0].exists === true;
  }

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  /**
   * Upsert multiple records based on a conflict column
   */
  async upsertMany(
    records: Record<string, unknown>[],
    conflictColumn: string,
    updateColumns?: string[]
  ): Promise<void> {
    if (records.length === 0) {
      return;
    }

    const allColumns = Object.keys(records[0]);
    const dataColumns = allColumns.filter((col) => col !== 'created_at');

    const placeholders = dataColumns.map((_, i) => `$${i + 1}`).join(', ');

    const valuesRows = records
      .map(
        (record) =>
          `(${dataColumns
            .map((col) => {
              const val = record[col];
              return val === null
                ? 'NULL'
                : typeof val === 'string'
                  ? `'${val.replace(/'/g, "''")}'`
                  : val;
            })
            .join(', ')})`
      )
      .join(', ');

    const updateClause = updateColumns
      ? updateColumns.map((col) => `${col} = EXCLUDED.${col}`).join(', ')
      : dataColumns.map((col) => `${col} = EXCLUDED.${col}`).join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${dataColumns.join(', ')})
      VALUES ${valuesRows}
      ON CONFLICT (${conflictColumn})
      DO UPDATE SET ${updateClause}
    `;

    await this.pool.query(query);
  }

  /**
   * Execute a raw SQL query
   */
  async raw<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }
}

export default BaseRepository;
