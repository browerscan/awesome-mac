/**
 * CORS configuration for API routes
 * Provides secure cross-origin resource sharing policies
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

/**
 * Default CORS configuration
 */
const defaultCorsConfig: CorsConfig = {
  allowedOrigins: [
    // Allow same origin
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    // Allow GitHub Pages (if deployed)
    'https://jaywcjlove.github.io',
    // Add production URLs here
  ],
  allowedMethods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: false,
  maxAge: 86400, // 24 hours
};

/**
 * Parse allowed origins from environment
 * Comma-separated list of origins
 */
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map((origin) => origin.trim());
  }
  return defaultCorsConfig.allowedOrigins;
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null, allowed: string[]): boolean {
  if (!origin) return false;

  // Check for exact match
  if (allowed.includes(origin)) {
    return true;
  }

  // Check for wildcard subdomains (e.g., https://*.example.com)
  for (const allowedOrigin of allowed) {
    if (allowedOrigin.includes('*')) {
      const pattern = allowedOrigin.replace(/\*/g, '[^.]+');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(origin)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Apply CORS headers to a response
 */
export function applyCorsHeaders(
  request: NextRequest,
  response: NextResponse,
  config?: Partial<CorsConfig>
): NextResponse {
  const fullConfig: CorsConfig = {
    ...defaultCorsConfig,
    ...config,
    allowedOrigins: getAllowedOrigins(),
  };

  const origin = request.headers.get('origin');

  // Only set CORS headers if the origin is allowed
  if (origin && isOriginAllowed(origin, fullConfig.allowedOrigins)) {
    response.headers.set('Access-Control-Allow-Origin', origin);

    if (fullConfig.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    response.headers.set('Access-Control-Allow-Methods', fullConfig.allowedMethods.join(', '));

    response.headers.set('Access-Control-Allow-Headers', fullConfig.allowedHeaders.join(', '));

    response.headers.set('Access-Control-Max-Age', fullConfig.maxAge.toString());

    // Vary header for proper caching
    response.headers.set('Vary', 'Origin');
  }

  return response;
}

/**
 * Create a CORS preflight response
 */
export function createCorsPreflightResponse(
  request: NextRequest,
  config?: Partial<CorsConfig>
): NextResponse {
  const fullConfig: CorsConfig = {
    ...defaultCorsConfig,
    ...config,
    allowedOrigins: getAllowedOrigins(),
  };

  const origin = request.headers.get('origin');

  const response = new NextResponse(null, { status: 204 });

  if (origin && isOriginAllowed(origin, fullConfig.allowedOrigins)) {
    response.headers.set('Access-Control-Allow-Origin', origin);

    if (fullConfig.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    response.headers.set('Access-Control-Allow-Methods', fullConfig.allowedMethods.join(', '));

    response.headers.set('Access-Control-Allow-Headers', fullConfig.allowedHeaders.join(', '));

    response.headers.set('Access-Control-Max-Age', fullConfig.maxAge.toString());

    response.headers.set('Vary', 'Origin');
  }

  return response;
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export function handleCorsPreflight(
  request: NextRequest,
  config?: Partial<CorsConfig>
): NextResponse | null {
  if (request.method === 'OPTIONS') {
    return createCorsPreflightResponse(request, config);
  }
  return null;
}

/**
 * Strict CORS configuration for API routes
 * Only allows GET requests from same origin
 */
export const strictCorsConfig: Partial<CorsConfig> = {
  allowedOrigins: ['self'], // Will be replaced with actual origin
  allowedMethods: ['GET'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
  maxAge: 86400,
};

/**
 * Permissive CORS configuration for public APIs
 */
export const publicCorsConfig: Partial<CorsConfig> = {
  allowedOrigins: ['*'],
  allowedMethods: ['GET'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
  maxAge: 86400,
};
