import Link from 'next/link';
import { App } from '@/types';
import { StaticAppIcon } from './AppIcon';
import { Badge } from './Badge';

interface RecentlyAddedProps {
  apps: App[];
  maxItems?: number;
  className?: string;
}

/**
 * RecentlyAdded Section Component
 *
 * Displays newly added apps with a visual indicator.
 * This component shows a grid of recent apps with special badges.
 */
export function RecentlyAdded({ apps, maxItems = 6, className = '' }: RecentlyAddedProps) {
  // Get the most recent apps (in a real app, these would be sorted by createdAt)
  const recentApps = apps.slice(0, maxItems);

  if (recentApps.length === 0) {
    return null;
  }

  return (
    <section
      className={`border-t border-gray-200 bg-white px-4 py-12 dark:border-gray-800 dark:bg-gray-900 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recently Added</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Check out the latest apps added to our collection
            </p>
          </div>
          <Link
            href="/apps?sort=newest"
            className="group inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View all new apps
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
          {recentApps.map((app) => (
            <RecentlyAddedCard key={app.id} app={app} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface RecentlyAddedCardProps {
  app: App;
}

function RecentlyAddedCard({ app }: RecentlyAddedCardProps) {
  return (
    <Link
      href={`/apps/${app.slug}`}
      className="group flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
    >
      {/* App Icon */}
      <StaticAppIcon app={app} size="lg" className="shrink-0" />

      {/* App Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
            {app.name}
          </h3>
          <Badge variant="new" className="shrink-0">
            New
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
interface RecentlyAddedCompactProps {
  apps: App[];
  maxItems?: number;
}

export function RecentlyAddedCompact({ apps, maxItems = 4 }: RecentlyAddedCompactProps) {
  const recentApps = apps.slice(0, maxItems);

  if (recentApps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600 dark:bg-blue-900 dark:text-blue-400">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </span>
        Recently Added
      </h3>
      <div className="space-y-2">
        {recentApps.map((app) => (
          <Link
            key={app.id}
            href={`/apps/${app.slug}`}
            className="group flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-2.5 pr-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50 dark:hover:bg-gray-800"
          >
            <StaticAppIcon app={app} size="sm" className="shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                  {app.name}
                </span>
                <Badge variant="new" className="shrink-0 !px-1.5 !py-0 !text-[10px]">
                  New
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
