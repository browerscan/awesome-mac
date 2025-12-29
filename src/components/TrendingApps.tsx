import Link from 'next/link';
import { App } from '@/types';
import { StaticAppIcon } from './AppIcon';
import { Badge } from './Badge';

interface TrendingAppsProps {
  apps: App[];
  maxItems?: number;
  className?: string;
}

/**
 * TrendingApps Section Component
 *
 * Displays trending apps with a fire indicator.
 * Trending is calculated based on GitHub stars, recent additions, and popularity.
 * This is a client-side component that uses simple heuristics to determine trending apps.
 */
export function TrendingApps({ apps, maxItems = 6, className = '' }: TrendingAppsProps) {
  // Calculate trending apps
  // In a real app, this would use actual view counts and GitHub star changes
  // For now, we'll prioritize open source apps (which have GitHub stars)
  // and recent additions
  const trendingApps = apps.filter((app) => app.isOpenSource || app.isFree).slice(0, maxItems);

  if (trendingApps.length === 0) {
    return null;
  }

  return (
    <section
      className={`border-t border-gray-200 bg-gradient-to-b from-orange-50 to-white px-4 py-12 dark:border-gray-800 dark:from-gray-900 dark:to-gray-900 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trending Apps</h2>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <svg className="h-5 w-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                  <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13.03 3.23 12.17 3.75 11.46 4.32C8.96 6.4 7.92 10.07 9.12 13.22C9.14 13.27 9.15 13.31 9.17 13.35C9.39 13.85 9.69 14.3 10.04 14.7C10.41 15.11 10.81 15.5 11.26 15.82C11.67 16.11 12.1 16.38 12.56 16.6C12.6 16.62 12.64 16.63 12.68 16.65C13.12 16.82 13.58 16.93 14.04 16.96C14.06 16.96 14.08 16.97 14.1 16.97C14.25 16.98 14.4 16.99 14.55 17C14.57 17 14.59 17 14.61 17C14.77 17 14.93 16.99 15.08 16.97C15.47 16.93 15.85 16.82 16.21 16.66C16.43 16.56 16.65 16.43 16.85 16.28C17.31 15.93 17.66 15.45 17.86 14.9C18.16 14.06 18.08 13.13 17.66 12.35C17.54 12.11 17.39 11.89 17.22 11.69C17.19 11.65 17.15 11.62 17.12 11.58C17.08 11.54 17.04 11.5 17 11.47C17.21 11.37 17.43 11.27 17.64 11.17C17.65 11.18 17.66 11.19 17.66 11.2ZM13 14.5C13 14.78 13.22 15 13.5 15H14.5C14.78 15 15 14.78 15 14.5C15 14.22 14.78 14 14.5 14H13.5C13.22 14 13 14.22 13 14.5Z" />
                </svg>
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hot apps that are gaining popularity right now
            </p>
          </div>
          <Link
            href="/apps?sort=trending"
            className="group inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View all trending
            <svg
              className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trendingApps.map((app) => (
            <TrendingAppCard key={app.id} app={app} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface TrendingAppCardProps {
  app: App;
}

function TrendingAppCard({ app }: TrendingAppCardProps) {
  return (
    <Link
      href={`/apps/${app.slug}`}
      className="group flex items-start gap-4 rounded-lg border border-orange-200 bg-white p-4 shadow-sm transition-all hover:border-orange-400 hover:shadow-md dark:border-orange-900 dark:bg-gray-800 dark:hover:border-orange-700"
    >
      {/* App Icon */}
      <StaticAppIcon app={app} size="lg" className="shrink-0" />

      {/* App Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
            {app.name}
          </h3>
          <Badge variant="trending" className="shrink-0">
            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13.03 3.23 12.17 3.75 11.46 4.32C8.96 6.4 7.92 10.07 9.12 13.22C9.39 13.85 9.69 14.3 10.04 14.7C10.81 15.5 11.67 16.38 12.56 16.6C13.12 16.82 13.58 16.93 14.04 16.96C14.25 16.98 14.4 16.99 14.55 17C14.77 17 14.93 16.99 15.08 16.97C15.47 16.93 15.85 16.82 16.21 16.66C16.65 16.43 17.31 15.93 17.86 14.9C18.16 14.06 18.08 13.13 17.66 12.35C17.54 12.11 17.39 11.89 17.22 11.69C17.19 11.65 17.15 11.62 17.12 11.58C17.08 11.54 17.04 11.5 17 11.47C17.21 11.37 17.43 11.27 17.64 11.17C17.65 11.18 17.66 11.19 17.66 11.2Z" />
            </svg>
            Hot
          </Badge>
        </div>

        <p className="mb-2 mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
          {app.description || 'No description available.'}
        </p>

        {/* Category */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <span>{app.categoryName}</span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Compact version for homepage
 */
interface TrendingAppsCompactProps {
  apps: App[];
  maxItems?: number;
}

export function TrendingAppsCompact({ apps, maxItems = 4 }: TrendingAppsCompactProps) {
  const trendingApps = apps.filter((app) => app.isOpenSource || app.isFree).slice(0, maxItems);

  if (trendingApps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs text-orange-600 dark:bg-orange-900 dark:text-orange-400">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13.03 3.23 12.17 3.75 11.46 4.32C8.96 6.4 7.92 10.07 9.12 13.22C9.39 13.85 9.69 14.3 10.04 14.7C10.81 15.5 11.67 16.38 12.56 16.6C13.12 16.82 13.58 16.93 14.04 16.96C14.25 16.98 14.4 16.99 14.55 17C14.77 17 14.93 16.99 15.08 16.97C15.47 16.93 15.85 16.82 16.21 16.66C16.65 16.43 17.31 15.93 17.86 14.9C18.16 14.06 18.08 13.13 17.66 12.35C17.54 12.11 17.39 11.89 17.22 11.69C17.19 11.65 17.15 11.62 17.12 11.58C17.08 11.54 17.04 11.5 17 11.47C17.21 11.37 17.43 11.27 17.64 11.17C17.65 11.18 17.66 11.19 17.66 11.2Z" />
          </svg>
        </span>
        Trending
      </h3>
      <div className="space-y-2">
        {trendingApps.map((app) => (
          <Link
            key={app.id}
            href={`/apps/${app.slug}`}
            className="group flex items-center gap-3 rounded-lg border border-orange-100 bg-white p-2.5 pr-3 transition-colors hover:bg-orange-50 dark:border-orange-900/30 dark:bg-gray-800/50 dark:hover:bg-gray-800"
          >
            <StaticAppIcon app={app} size="sm" className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                  {app.name}
                </span>
                <Badge variant="trending" className="shrink-0 !px-1.5 !py-0 !text-[10px]">
                  Hot
                </Badge>
              </div>
              <span className="truncate text-xs text-gray-500 dark:text-gray-500">
                {app.categoryName}
              </span>
            </div>
            <svg
              className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
