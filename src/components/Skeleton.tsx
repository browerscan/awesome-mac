import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const variantStyles = {
  text: 'rounded h-4',
  circular: 'rounded-full',
  rectangular: 'rounded-none',
  rounded: 'rounded-lg',
};

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const animationClass = animation === 'pulse' ? 'animate-pulse' : '';
  const variantClass = variantStyles[variant];

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={clsx('bg-gray-200 dark:bg-gray-700', variantClass, animationClass, className)}
      style={style}
      aria-hidden="true"
    />
  );
}

// Shimmer effect skeleton
interface ShimmerProps {
  className?: string;
  children?: React.ReactNode;
}

export function Shimmer({ className = '', children }: ShimmerProps) {
  return (
    <div
      className={clsx('relative overflow-hidden bg-gray-200 dark:bg-gray-700', className)}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-gray-300/50 to-transparent dark:via-gray-600/50" />
      {children}
    </div>
  );
}

// AppCard Skeleton
export function AppCardSkeleton() {
  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Icon Skeleton */}
      <Skeleton variant="circular" width={48} height={48} className="mb-4" />

      {/* Title Skeleton */}
      <Skeleton variant="text" width="70%" height={20} className="mb-2" />

      {/* Description Lines */}
      <Skeleton variant="text" width="100%" className="mb-1.5" />
      <Skeleton variant="text" width="100%" className="mb-1.5" />
      <Skeleton variant="text" width="60%" className="mb-4" />

      {/* Badges Skeleton */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Skeleton variant="rounded" width={60} height={24} />
        <Skeleton variant="rounded" width={100} height={24} />
      </div>

      {/* Action Skeleton */}
      <Skeleton variant="rounded" width={80} height={16} className="mt-auto" />
    </div>
  );
}

// CategoryCard Skeleton
export function CategoryCardSkeleton() {
  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Icon Skeleton */}
      <Skeleton variant="rounded" width={40} height={40} className="mb-4" />

      {/* Title Skeleton */}
      <Skeleton variant="text" width="60%" height={20} className="mb-2" />

      {/* Description Lines */}
      <Skeleton variant="text" width="100%" className="mb-1" />
      <Skeleton variant="text" width="80%" className="mb-4" />

      {/* Stats Skeleton */}
      <div className="mt-auto flex items-center gap-4">
        <Skeleton variant="text" width={60} height={14} />
        <Skeleton variant="text" width={80} height={14} />
      </div>
    </div>
  );
}

// Hero Section Skeleton
export function HeroSkeleton() {
  return (
    <section className="border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white px-4 py-16 dark:border-gray-800 dark:from-gray-900 dark:to-gray-900">
      <div className="mx-auto max-w-7xl text-center">
        {/* Title Skeleton */}
        <Skeleton variant="text" width="60%" height={48} className="mx-auto mb-6" />

        {/* Description Skeleton */}
        <Skeleton variant="text" width="80%" height={24} className="mx-auto mb-8" />

        {/* Search Skeleton */}
        <Skeleton variant="rounded" width="100%" height={48} className="mx-auto max-w-xl" />

        {/* Stats Skeleton */}
        <div className="mt-10 flex flex-wrap justify-center gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <Skeleton variant="text" width={60} height={36} className="mx-auto mb-1" />
              <Skeleton variant="text" width={80} height={16} className="mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Loading Spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-blue-600 border-t-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Loading boundary wrapper
interface LoadingBoundaryProps {
  isLoading: boolean;
  error?: Error | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export function LoadingBoundary({
  isLoading,
  error = null,
  children,
  fallback,
  errorFallback,
}: LoadingBoundaryProps) {
  if (error) {
    return (
      errorFallback || (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-300">
            Something went wrong. Please try again later.
          </p>
        </div>
      )
    );
  }

  if (isLoading) {
    return fallback || <LoadingSpinner />;
  }

  return <>{children}</>;
}

// Grid skeleton for multiple cards
interface SkeletonGridProps {
  count?: number;
  type?: 'app' | 'category';
}

export function SkeletonGrid({ count = 8, type = 'app' }: SkeletonGridProps) {
  const SkeletonComponent = type === 'app' ? AppCardSkeleton : CategoryCardSkeleton;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}
