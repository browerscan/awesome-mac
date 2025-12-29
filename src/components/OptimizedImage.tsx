'use client';

import { useState, useRef, useEffect } from 'react';
import { blurPlaceholder, lazyLoadOptions, preloadImage } from '@/lib/performance';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  priority?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
  placeholder?: 'blur' | 'empty';
  blurColor?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OptimizedImage component with lazy loading, blur placeholders, and priority hints
 * Use this for external images that aren't served through Next.js Image Optimization
 */
export function OptimizedImage({
  src,
  alt,
  width = '100%',
  height = 'auto',
  className = '',
  priority = false,
  fetchPriority = 'auto',
  placeholder = 'blur',
  blurColor = '#e5e7eb',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (priority || isInView || !imgRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        }
      });
    }, lazyLoadOptions);

    observerRef.current = observer;
    observer.observe(imgRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority, isInView]);

  // Preload image if priority
  useEffect(() => {
    if (priority && src) {
      preloadImage(src).catch(() => {
        setHasError(true);
      });
    }
  }, [priority, src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate blur placeholder data URL
  const getBlurPlaceholder = () => {
    if (placeholder === 'blur') {
      // Simple SVG blur placeholder
      const svg =
        '<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" fill="' +
        blurColor +
        '"/></svg>';
      return 'data:image/svg+xml;base64,' + btoa(svg);
    }
    return blurPlaceholder;
  };

  // Show placeholder while not in view (unless priority)
  if (!isInView && !priority) {
    return (
      <div
        ref={imgRef}
        className={'bg-gray-100 dark:bg-gray-800 ' + className}
        style={{ width, height }}
        aria-label={alt}
      />
    );
  }

  return (
    <div className={'relative ' + className} style={{ width, height }}>
      {/* Blur placeholder */}
      {placeholder === 'blur' && !isLoaded && !hasError && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            backgroundImage: 'url(' + getBlurPlaceholder() + ')',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={typeof width === 'number' ? width : undefined}
        height={typeof height === 'number' ? height : undefined}
        fetchPriority={priority ? 'high' : fetchPriority}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={
          'transition-opacity duration-300 ' +
          (isLoaded ? 'opacity-100' : 'opacity-0') +
          (hasError ? ' hidden' : '')
        }
        style={{ width, height }}
      />

      {/* Error fallback */}
      {hasError && (
        <div
          className="flex items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
          style={{ width, height }}
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

/**
 * OptimizedAppIcon component for app icons with consistent sizing
 */
interface OptimizedAppIconProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const iconSizes = {
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 48, height: 48 },
};

export function OptimizedAppIcon({
  src,
  name,
  size = 'md',
  className = '',
}: OptimizedAppIconProps) {
  const { width, height } = iconSizes[size];
  const initial = name.charAt(0).toUpperCase();

  if (!src) {
    // Fallback to gradient background with initial
    return (
      <div
        className={
          'flex items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 text-sm font-bold text-gray-500 dark:from-gray-700 dark:to-gray-600 dark:text-gray-400 ' +
          className
        }
        style={{ width, height }}
      >
        {initial}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={name + ' icon'}
      width={width}
      height={height}
      className={'rounded-lg ' + className}
      placeholder="blur"
      blurColor="#f3f4f6"
    />
  );
}
