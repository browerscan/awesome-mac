'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number | number[];
  className?: string;
}

/**
 * LazyLoad component - defers rendering of children until they enter viewport
 * Use this to defer non-critical components and improve initial page load
 */
export function LazyLoad({
  children,
  fallback = null,
  rootMargin = '200px 0px',
  threshold = 0.01,
  className = '',
}: LazyLoadProps) {
  const [isInView, setIsInView] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || hasIntersected) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasIntersected) {
            setIsInView(true);
            setHasIntersected(true);
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        });
      },
      { rootMargin, threshold }
    );

    observerRef.current = observer;
    observer.observe(container);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [rootMargin, threshold, hasIntersected]);

  return (
    <div ref={containerRef} className={className}>
      {isInView ? children : fallback}
    </div>
  );
}

/**
 * LazyComponent wrapper for code splitting with dynamic imports
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  return function LazyComponent(props: React.ComponentProps<T>) {
    const [Component, setComponent] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      importFn()
        .then((module) => {
          setComponent(() => module.default);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err);
          setIsLoading(false);
        });
    }, []);

    if (error) {
      return (
        <div className="p-4 text-red-600 dark:text-red-400">
          Failed to load component: {error.message}
        </div>
      );
    }

    if (isLoading || !Component) {
      return fallback ?? <div className="animate-pulse bg-gray-100 dark:bg-gray-800" />;
    }

    return <Component {...props} />;
  };
}

/**
 * PrefetchOnHover component - prefetches a link when user hovers
 */
interface PrefetchOnHoverProps {
  href: string;
  children: (props: { onMouseEnter: () => void; onTouchStart: () => void }) => ReactNode;
}

export function PrefetchOnHover({ href, children }: PrefetchOnHoverProps) {
  const handlePrefetch = () => {
    if (typeof window === 'undefined') return;

    // Use Next.js router prefetch if available
    if ((window as any).next?.router) {
      (window as any).next.router.prefetch(href);
    } else {
      // Fallback to link prefetch
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }
  };

  return (
    <>
      {children({
        onMouseEnter: handlePrefetch,
        onTouchStart: handlePrefetch,
      })}
    </>
  );
}
