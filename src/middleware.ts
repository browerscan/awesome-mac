import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import type { NextFetchEvent } from 'next/server';

// Security headers to apply to all requests
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'off',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Cross-Origin-Resource-Policy': 'same-origin',
  // Add HSTS only in production
  ...(process.env.NODE_ENV === 'production'
    ? {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      }
    : {}),
};

// Build Permissions-Policy header
const PERMISSIONS_POLICY = Object.entries({
  camera: ['none'],
  microphone: ['none'],
  geolocation: ['self'],
  'interest-cohort': ['none'],
  'browsing-topics': ['none'],
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
})
  .map(([feature, allowList]) => `${feature}=${allowList.join(' ')}`)
  .join(', ');

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const response = intlMiddleware(req);

  // Apply security headers to the response
  Object.entries({
    ...SECURITY_HEADERS,
    'Permissions-Policy': PERMISSIONS_POLICY,
  }).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  // Match all pathnames except for
  // - API routes (they handle their own security headers)
  // - Next.js internals
  // - Static files
  matcher: [
    // Match all pathnames except for
    // - API routes
    // - Next.js internals
    // - Static files
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
