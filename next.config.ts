import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  // Enable standalone output for Cloudflare deployment
  output: 'standalone',

  // Add trailing slash to help with routing
  trailingSlash: false,

  // Skip trailing slash redirect
  skipTrailingSlashRedirect: false,

  // Force dynamic rendering for all routes to avoid Html import issues
  // This will disable static generation and make all pages server-rendered
  productionBrowserSourceMaps: false,

  // Memory optimization for development
  onDemandEntries: {
    maxInactiveAge: 15 * 1000,
    pagesBufferLength: 3,
  },

  experimental: {
    reactCompiler: false,
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },

  // Disable X-Powered-By header for security
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.github.com',
      },
      {
        protocol: 'https',
        hostname: '**.apple.com',
      },
      {
        protocol: 'https',
        hostname: 'is1-ssl.mzstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'is2-ssl.mzstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'is3-ssl.mzstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'is4-ssl.mzstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'is5-ssl.mzstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'www.google.com',
      },
    ],
    // Enable modern image formats
    formats: ['image/avif', 'image/webp'],
    // Optimize device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimum cache TTL for optimized images (60 seconds)
    minimumCacheTTL: 60,
  },

  // Enable compression for production
  compress: true,

  // Bundle optimization with webpack
  webpack: (config, { isServer }) => {
    // Optimize chunk splitting
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor chunk for npm packages
            vendor: {
              test: /[/\\]node_modules[/\\]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Common chunk for shared code
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
              name: 'common',
            },
          },
        },
      };
    }

    // Reduce bundle size with tree shaking
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: true,
    };

    return config;
  },

  // Generate a unique build ID to force dynamic rendering
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },

  // Headers for caching and security
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';

    // Build Permissions-Policy header
    const permissionsPolicy = Object.entries({
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

    // Base security headers
    const securityHeaders = [
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: permissionsPolicy,
      },
      {
        key: 'Cross-Origin-Resource-Policy',
        value: 'same-origin',
      },
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'off',
      },
      {
        key: 'X-Download-Options',
        value: 'noopen',
      },
      {
        key: 'X-Permitted-Cross-Domain-Policies',
        value: 'none',
      },
      ...(isProduction
        ? [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains; preload',
            },
          ]
        : []),
    ];

    return [
      // Apply security headers to all routes
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Static assets caching
      {
        source: '/:all*(svg|jpg|jpeg|png|ico|webp|avif|gif)',
        locale: false,
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API routes with security headers and rate limit info
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },

  // Redirects for SEO and canonical URLs
  async redirects() {
    return [];
  },
};

// Wrap nextConfig with next-intl plugin only (PayloadCMS removed for static compatibility)
export default withNextIntl(nextConfig);
