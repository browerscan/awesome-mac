/**
 * Security headers configuration for Next.js
 * Provides comprehensive security headers for production applications
 */

import type { NextRequest, NextResponse } from 'next/server';

export interface SecurityHeaderConfig {
  frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  contentTypeOptions: boolean;
  referrerPolicy:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
  permissionsPolicy: Record<string, string[]>;
  strictTransportSecurity: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  contentSecurityPolicy: {
    enabled: boolean;
    directives: Record<string, string | string[]>;
  };
  crossOriginEmbedderPolicy: boolean;
  crossOriginOpenerPolicy: boolean;
  crossOriginResourcePolicy: 'same-origin' | 'same-site' | 'cross-origin';
}

/**
 * Default security headers configuration
 */
export const defaultSecurityConfig: SecurityHeaderConfig = {
  frameOptions: 'DENY',
  contentTypeOptions: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    // Disable sensitive features by default
    camera: ['none'],
    microphone: ['none'],
    geolocation: ['self'],
    'interest-cohort': ['none'], // Disable FLoC
    'browsing-topics': ['none'], // Disable Topics API
    accelerometer: ['none'],
    'ambient-light-sensor': ['none'],
    autoplay: ['self'],
    battery: ['none'],
    'display-capture': ['none'],
    'document-domain': ['none'],
    'encrypted-media': ['self'],
    'execution-while-not-rendered': ['none'],
    'execution-while-out-of-viewport': ['none'],
    fullscreen: ['self'],
    gyroscope: ['none'],
    hid: ['none'],
    'idle-detection': ['none'],
    'local-fonts': ['none'],
    magnetometer: ['none'],
    midi: ['none'],
    payment: ['self'],
    'picture-in-picture': ['self'],
    'publickey-credentials-get': ['self'],
    'screen-wake-lock': ['self'],
    serial: ['none'],
    'sync-xhr': ['none'],
    usb: ['none'],
    'web-share': ['self'],
    'xr-spatial-tracking': ['none'],
  },
  strictTransportSecurity: {
    enabled: process.env.NODE_ENV === 'production',
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  contentSecurityPolicy: {
    enabled: false, // Enable when CSP is fully configured
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:', 'https://*.githubusercontent.com'],
      'font-src': ["'self'", 'data:'],
      'connect-src': ["'self'"],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'navigate-to': ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: 'same-origin',
};

/**
 * Build the Permissions-Policy header value
 */
function buildPermissionsPolicy(policies: Record<string, string[]>): string {
  return Object.entries(policies)
    .map(([feature, allowList]) => {
      const list = allowList.join(' ');
      return list ? `${feature}=${list}` : feature;
    })
    .join(', ');
}

/**
 * Build the Content-Security-Policy header value
 */
function buildContentSecurityPolicy(directives: Record<string, string | string[]>): string {
  return Object.entries(directives)
    .map(([directive, value]) => {
      if (Array.isArray(value)) {
        return `${directive} ${value.join(' ')}`;
      }
      return `${directive} ${value}`;
    })
    .join('; ');
}

/**
 * Apply security headers to a NextResponse
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: Partial<SecurityHeaderConfig> = {}
): NextResponse {
  const fullConfig: SecurityHeaderConfig = {
    ...defaultSecurityConfig,
    ...config,
    permissionsPolicy: {
      ...defaultSecurityConfig.permissionsPolicy,
      ...(config.permissionsPolicy || {}),
    },
    contentSecurityPolicy: config.contentSecurityPolicy
      ? {
          ...defaultSecurityConfig.contentSecurityPolicy,
          ...config.contentSecurityPolicy,
          directives: {
            ...defaultSecurityConfig.contentSecurityPolicy.directives,
            ...(config.contentSecurityPolicy.directives || {}),
          },
        }
      : defaultSecurityConfig.contentSecurityPolicy,
  };

  // X-Frame-Options (deprecated but still useful)
  response.headers.set('X-Frame-Options', fullConfig.frameOptions);

  // X-Content-Type-Options
  if (fullConfig.contentTypeOptions) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }

  // Referrer-Policy
  response.headers.set('Referrer-Policy', fullConfig.referrerPolicy);

  // Permissions-Policy
  const permissionsPolicy = buildPermissionsPolicy(fullConfig.permissionsPolicy);
  response.headers.set('Permissions-Policy', permissionsPolicy);

  // Strict-Transport-Security (HTTPS only)
  if (fullConfig.strictTransportSecurity.enabled && process.env.NODE_ENV === 'production') {
    const sts = [
      `max-age=${fullConfig.strictTransportSecurity.maxAge}`,
      fullConfig.strictTransportSecurity.includeSubDomains ? 'includeSubDomains' : '',
      fullConfig.strictTransportSecurity.preload ? 'preload' : '',
    ]
      .filter(Boolean)
      .join('; ');
    response.headers.set('Strict-Transport-Security', sts);
  }

  // Content-Security-Policy
  if (fullConfig.contentSecurityPolicy.enabled) {
    const csp = buildContentSecurityPolicy(fullConfig.contentSecurityPolicy.directives);
    response.headers.set('Content-Security-Policy', csp);
  }

  // Cross-Origin Embedder Policy
  if (fullConfig.crossOriginEmbedderPolicy) {
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  }

  // Cross-Origin Opener Policy
  if (fullConfig.crossOriginOpenerPolicy) {
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  }

  // Cross-Origin Resource Policy
  response.headers.set('Cross-Origin-Resource-Policy', fullConfig.crossOriginResourcePolicy);

  // Additional security headers
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // Remove server information
  response.headers.delete('X-Powered-By');

  return response;
}

/**
 * Middleware-compatible wrapper for security headers
 */
export function withSecurityHeaders(
  _request: NextRequest,
  response: NextResponse,
  config?: Partial<SecurityHeaderConfig>
): NextResponse {
  return applySecurityHeaders(response, config);
}

/**
 * Get security headers as an object for next.config.ts
 */
export function getNextConfigHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-DNS-Prefetch-Control': 'off',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Cross-Origin-Resource-Policy': 'same-origin',
  };

  // Add HSTS for production
  if (process.env.NODE_ENV === 'production') {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  // Add Permissions-Policy
  headers['Permissions-Policy'] = buildPermissionsPolicy(defaultSecurityConfig.permissionsPolicy);

  return headers;
}

/**
 * Development-friendly headers (less restrictive)
 */
export function getDevHeaders(): Record<string, string> {
  return {
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}
