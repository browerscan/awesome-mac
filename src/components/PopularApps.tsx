import Link from 'next/link';
import { App } from '@/types';
import { StaticAppIcon } from './AppIcon';
import { Badge } from './Badge';

interface PopularAppsProps {
  apps: App[];
  maxItems?: number;
  className?: string;
}

/**
 * PopularApps Section Component
 *
 * Displays most viewed/clicked apps based on popularity.
 * Since we don't have a database for tracking views, this component
 * uses heuristic-based popularity (apps with good characteristics like
 * being open source, free, and from popular categories).
 */
export function PopularApps({ apps, maxItems = 8, className = '' }: PopularAppsProps) {
  // Calculate popular apps using heuristics
  // Prioritize apps that are: open source, free, and from well-known categories
  const popularApps = apps.filter((app) => app.isOpenSource && app.isFree).slice(0, maxItems);

  if (popularApps.length === 0) {
    return null;
  }

  return (
    <section
      className={`border-t border-gray-200 bg-gray-50 px-4 py-12 dark:border-gray-800 dark:bg-gray-800/50 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Popular Apps</h2>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <svg className="h-5 w-5 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Most loved apps by the community
            </p>
          </div>
          <Link
            href="/apps?sort=popular"
            className="group inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View all popular
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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {popularApps.map((app) => (
            <PopularAppCard key={app.id} app={app} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface PopularAppCardProps {
  app: App;
}

function PopularAppCard({ app }: PopularAppCardProps) {
  return (
    <Link
      href={`/apps/${app.slug}`}
      className="group flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-purple-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-600"
    >
      {/* App Icon */}
      <div className="mb-3 flex items-center justify-center">
        <StaticAppIcon app={app} size="lg" />
      </div>

      {/* App Info */}
      <div className="flex-1 text-center">
        <h3 className="mb-1 text-base font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
          {app.name}
        </h3>

        <div className="mb-2 flex items-center justify-center">
          <Badge variant="popular" className="text-[10px]">
            Popular
          </Badge>
        </div>

        <p className="mb-2 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
          {app.description || 'No description available.'}
        </p>

        {/* Category */}
        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-500">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
 * Compact version for sidebar
 */
interface PopularAppsCompactProps {
  apps: App[];
  maxItems?: number;
}

export function PopularAppsCompact({ apps, maxItems = 5 }: PopularAppsCompactProps) {
  const popularApps = apps.filter((app) => app.isOpenSource && app.isFree).slice(0, maxItems);

  if (popularApps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs text-purple-600 dark:bg-purple-900 dark:text-purple-400">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </span>
        Popular
      </h3>
      <div className="space-y-2">
        {popularApps.map((app, index) => (
          <Link
            key={app.id}
            href={`/apps/${app.slug}`}
            className="group flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-2.5 pr-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50 dark:hover:bg-gray-800"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-600 dark:bg-purple-900 dark:text-purple-400">
              {index + 1}
            </span>
            <StaticAppIcon app={app} size="sm" className="shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                {app.name}
              </span>
              <span className="block truncate text-xs text-gray-500 dark:text-gray-500">
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
