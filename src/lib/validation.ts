/**
 * Input validation schemas using Zod
 * Provides type-safe validation for all API inputs
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';

/**
 * Sanitize user input to prevent injection attacks
 * Removes potentially dangerous characters while preserving legitimate content
 */
export function sanitizeInput(input: string): string {
  return (
    input
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove control characters except newlines and tabs
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
      // Trim whitespace
      .trim()
  );
}

/**
 * Sanitize search query specifically
 * Allows alphanumeric, spaces, and common search characters
 */
export function sanitizeSearchQuery(query: string): string {
  return (
    sanitizeInput(query)
      // Limit length to prevent DoS
      .slice(0, 200)
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Validate and sanitize a URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.href;
  } catch {
    return '';
  }
}

/**
 * Search query validation schema
 */
export const searchQuerySchema = z.object({
  q: z
    .string()
    .max(200, 'Search query must be less than 200 characters')
    .transform(sanitizeSearchQuery)
    .refine((val) => val.length > 0, {
      message: 'Search query cannot be empty',
    }),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => {
      const num = parseInt(val, 10);
      if (isNaN(num)) return 10;
      return Math.min(Math.max(Math.floor(num), 1), 25);
    }),
});

/**
 * Search query result type
 */
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

/**
 * Validate search query from URLSearchParams
 */
export function validateSearchQuery(searchParams: URLSearchParams): SearchQueryInput {
  const input = {
    q: searchParams.get('q') || '',
    limit: searchParams.get('limit') || '10',
  };

  return searchQuerySchema.parse(input);
}

/**
 * Common API error response
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Create a JSON error response
 */
export function createErrorResponse(
  error: ValidationError | Error,
  status: number = 400
): NextResponse {
  const body = {
    error: error.message,
    ...(error instanceof ValidationError && error.details ? { details: error.details } : {}),
  };

  return NextResponse.json(body, { status });
}

/**
 * Filter sync validation schema
 */
export const filterSchema = z.object({
  isFree: z.coerce.boolean().optional(),
  isOpenSource: z.coerce.boolean().optional(),
  isAppStore: z.coerce.boolean().optional(),
  categoryId: z.string().max(50).optional(),
});

export type FilterInput = z.infer<typeof filterSchema>;

/**
 * Validate filter parameters
 */
export function validateFilters(searchParams: URLSearchParams): FilterInput {
  const input = {
    isFree: searchParams.get('isFree'),
    isOpenSource: searchParams.get('isOpenSource'),
    isAppStore: searchParams.get('isAppStore'),
    categoryId: searchParams.get('categoryId'),
  };

  return filterSchema.parse(input);
}

/**
 * App ID validation schema
 */
export const appIdSchema = z
  .string()
  .min(1, 'App ID is required')
  .max(100, 'App ID too long')
  .transform(sanitizeInput)
  .refine((val) => /^[a-zA-Z0-9-_]+$/.test(val), {
    message: 'Invalid app ID format',
  });

export type AppIdInput = z.infer<typeof appIdSchema>;

/**
 * Validate app ID
 */
export function validateAppId(id: string): AppIdInput {
  return appIdSchema.parse(id);
}

/**
 * Category ID validation schema
 */
export const categoryIdSchema = z
  .string()
  .min(1, 'Category ID is required')
  .max(100, 'Category ID too long')
  .transform(sanitizeInput)
  .refine((val) => /^[a-zA-Z0-9-_]+$/.test(val), {
    message: 'Invalid category ID format',
  });

export type CategoryIdInput = z.infer<typeof categoryIdSchema>;

/**
 * Safe JSON parsing with validation
 */
export function safeJsonParse<T>(
  input: string,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const parsed = JSON.parse(input);
    const result = schema.safeParse(parsed);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return {
      success: false,
      error: result.error.issues[0]?.message || 'Validation failed',
    };
  } catch {
    return { success: false, error: 'Invalid JSON' };
  }
}

/**
 * Rate limit headers schema
 */
export const rateLimitHeadersSchema = z.object({
  'X-RateLimit-Limit': z.string().transform(Number),
  'X-RateLimit-Remaining': z.string().transform(Number),
  'X-RateLimit-Reset': z.string().transform((str) => new Date(str).getTime()),
});

/**
 * Environment variable validation
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URI: z.string().url().optional(),
  PAYLOAD_SECRET: z
    .string()
    .min(32, 'PAYLOAD_SECRET must be at least 32 characters')
    .refine(
      (val) => {
        // In production, PAYLOAD_SECRET must be set and at least 32 chars
        if (process.env.NODE_ENV === 'production') {
          return val.length >= 32;
        }
        return true;
      },
      {
        message: 'PAYLOAD_SECRET must be at least 32 characters in production',
      }
    ),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  SYNC_API_KEY: z.string().min(16).optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 */
export function validateEnv(): EnvConfig {
  return envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URI: process.env.DATABASE_URI,
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SYNC_API_KEY: process.env.SYNC_API_KEY,
  });
}
