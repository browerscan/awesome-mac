/**
 * Performance utilities for Core Web Vitals optimization
 */

/**
 * Image optimization configuration
 */
export const imageConfig = {
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  formats: ['image/avif', 'image/webp'] as const,
  minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
} as const;

/**
 * Cache configuration for ISR and static assets
 */
export const cacheConfig = {
  // ISR revalidation times (in seconds)
  revalidate: {
    default: 3600, // 1 hour
    frequent: 300, // 5 minutes for frequently updated content
    static: 86400, // 24 hours for rarely changing content
  },
  // Cache headers for static assets
  staticAssets: 'public, max-age=31536000, immutable', // 1 year
  apiResponse: 'public, s-maxage=60, stale-while-revalidate=300', // 5 min stale
} as const;

/**
 * Simple in-memory cache for server-side requests
 * Implements cache deduplication similar to React Cache
 */
const requestCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds for request deduplication

/**
 * Cache wrapper for fetch requests with automatic deduplication
 * Use this instead of direct fetch for consistent caching
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  ttl: number = CACHE_TTL
): Promise<T> {
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  const now = Date.now();

  // Check cache
  const cached = requestCache.get(cacheKey);
  if (cached && now - cached.timestamp < ttl) {
    return cached.data as T;
  }

  // Fetch fresh data
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();

  // Update cache
  requestCache.set(cacheKey, { data, timestamp: now });

  // Clean up old cache entries periodically
  if (requestCache.size > 100) {
    for (const [key, value] of requestCache.entries()) {
      if (now - value.timestamp > ttl) {
        requestCache.delete(key);
      }
    }
  }

  return data as T;
}

/**
 * Clear the request cache (useful for testing or invalidation)
 */
export function clearRequestCache(): void {
  requestCache.clear();
}

/**
 * Preload hints for critical resources
 */
export interface PreloadHint {
  href: string;
  as: 'script' | 'style' | 'image' | 'font' | 'fetch';
  type?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * Critical resources that should be preloaded
 */
export const criticalResources: PreloadHint[] = [
  {
    href: '/fonts/inter-var.woff2',
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
    fetchPriority: 'high',
  },
];

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  src: string,
  widths: readonly number[] = imageConfig.imageSizes
): string {
  if (src.startsWith('http')) {
    return widths.map((w) => `${src} ${w}w`).join(', ');
  }
  return widths.map((w) => `${src}?w=${w} ${w}w`).join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(breakpoints: {
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  default: string;
}): string {
  const sizes: string[] = [];

  if (breakpoints.xl) sizes.push(`(min-width: 1280px) ${breakpoints.xl}`);
  if (breakpoints.lg) sizes.push(`(min-width: 1024px) ${breakpoints.lg}`);
  if (breakpoints.md) sizes.push(`(min-width: 768px) ${breakpoints.md}`);
  if (breakpoints.sm) sizes.push(`(min-width: 640px) ${breakpoints.sm}`);
  sizes.push(breakpoints.default);

  return sizes.join(', ');
}

/**
 * Generate a blur placeholder for images (base64 encoded 1x1 transparent GIF)
 */
export const blurPlaceholder =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * Generate a colored blur placeholder for image loading
 */
export function generateBlurPlaceholder(color: string = '#e5e7eb'): string {
  // Create a simple SVG with the background color
  const svg = `<svg width="1" height="1" xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1" fill="${color}"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Get optimal image size based on container width and DPR
 */
export function getOptimalImageSize(
  containerWidth: number,
  dpr: number = window?.devicePixelRatio || 1
): number {
  const targetSize = Math.ceil(containerWidth * dpr);
  // Find the closest size from available image sizes
  const sizes = [...imageConfig.deviceSizes, ...imageConfig.imageSizes].sort((a, b) => a - b);
  return sizes.find((size) => size >= targetSize) || sizes[sizes.length - 1];
}

/**
 * Check if code is running on server
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Check if code is running on client
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Defer non-critical CSS loading
 */
export function deferStylesheet(href: string): void {
  if (isServer()) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.media = 'print';
  link.onload = () => {
    link.media = 'all';
  };
  document.head.appendChild(link);
}

/**
 * Preload an image
 */
export function preloadImage(src: string): Promise<void> {
  if (isServer()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Intersection Observer options for lazy loading
 */
export const lazyLoadOptions: IntersectionObserverInit = {
  root: null,
  rootMargin: '200px 0px', // Increased margin for earlier loading
  threshold: 0.01,
};

/**
 * Create a lazy load observer
 */
export function createLazyLoadObserver(
  onIntersect: (element: Element) => void
): IntersectionObserver | null {
  if (isServer()) return null;

  return new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        onIntersect(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, lazyLoadOptions);
}

/**
 * Measure and report web vitals
 */
export interface WebVitalMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Web Vitals thresholds
 */
export const webVitalsThresholds = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
} as const;

/**
 * Get rating for a web vital metric
 */
export function getWebVitalRating(
  name: keyof typeof webVitalsThresholds,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = webVitalsThresholds[name];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report web vital to analytics
 */
export function reportWebVital(metric: WebVitalMetric): void {
  // Send to analytics endpoint
  if (isClient() && process.env.NODE_ENV === 'production') {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      page: window.location.pathname,
    });

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/vitals', body);
    } else {
      fetch('/api/vitals', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      });
    }
  }
}

/**
 * Prefetch a page for faster navigation
 */
export function prefetchPage(href: string): void {
  if (isServer()) return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Preconnect to an origin
 */
export function preconnect(origin: string): void {
  if (isServer()) return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

/**
 * DNS prefetch for an origin
 */
export function dnsPrefetch(origin: string): void {
  if (isServer()) return;

  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = origin;
  document.head.appendChild(link);
}

/**
 * Common origins to preconnect
 */
export const preconnectOrigins = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://www.google-analytics.com',
  'https://github.githubassets.com',
  'https://avatars.githubusercontent.com',
] as const;

/**
 * Initialize performance optimizations
 */
export function initPerformanceOptimizations(): void {
  if (isServer()) return;

  // Preconnect to common origins
  preconnectOrigins.forEach(preconnect);

  // Add event listener to prefetch links on hover
  document.addEventListener(
    'mouseover',
    (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.href && link.href.startsWith(window.location.origin)) {
        prefetchPage(link.href);
      }
    },
    { passive: true }
  );
}

/**
 * Code splitting helper for dynamic imports
 * Wraps dynamic imports with error boundary and loading state
 */
export function createDynamicImport<T>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  return {
    loader: importFn,
    loading: fallback,
    // Error boundary should handle the error component
  };
}

/**
 * Prefetch route resources for navigation
 */
export function prefetchRoute(href: string): void {
  if (isServer()) return;

  // Prefetch the page
  prefetchPage(href);

  // Preconnect to likely external resources
  try {
    const url = new URL(href, window.location.origin);
    if (url.hostname !== window.location.hostname) {
      preconnect(url.origin);
    }
  } catch {
    // Invalid URL, skip
  }
}
