import Link from 'next/link';
import { useLocale } from 'next-intl';
import { App } from '@/types';
import { StaticAppIcon } from './AppIcon';

interface RelatedAppsProps {
  currentApp: App;
  allApps: App[];
  maxItems?: number;
  className?: string;
}

/**
 * RelatedApps Widget Component
 *
 * Displays "You might also like" apps based on:
 * - Same category
 * - Similar characteristics (free, open source, etc.)
 * - Tags (when available in the future)
 */
export function RelatedApps({
  currentApp,
  allApps,
  maxItems = 4,
  className = '',
}: RelatedAppsProps) {
  const locale = useLocale();

  // Find related apps based on category and characteristics
  const relatedApps = allApps
    .filter((app) => {
      // Exclude current app
      if (app.id === currentApp.id) return false;

      // Same category gets high priority
      if (app.categoryId === currentApp.categoryId) return true;

      // If app is open source, show other open source apps
      if (currentApp.isOpenSource && app.isOpenSource) {
        return Math.random() > 0.5; // Random selection for variety
      }

      // If app is free, show other free apps
      if (currentApp.isFree && app.isFree) {
        return Math.random() > 0.7; // Lower priority
      }

      return false;
    })
    .slice(0, maxItems);

  if (relatedApps.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50 ${className}`}
    >
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
        <svg
          className="h-5 w-5 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        You might also like
      </h3>

      <div className="space-y-3">
        {relatedApps.map((app) => (
          <Link
            key={app.id}
            href={`/${locale}/apps/${app.slug}`}
            className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
          >
            <StaticAppIcon app={app} size="sm" className="shrink-0" />
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                {app.name}
              </h4>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {app.categoryName}
              </p>
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

/**
 * Horizontal version for app detail pages
 */
export function RelatedAppsHorizontal({
  currentApp,
  allApps,
  maxItems = 4,
  className = '',
}: RelatedAppsProps) {
  const locale = useLocale();

  const relatedApps = allApps
    .filter((app) => {
      if (app.id === currentApp.id) return false;
      if (app.categoryId === currentApp.categoryId) return true;
      if (currentApp.isOpenSource && app.isOpenSource) return Math.random() > 0.5;
      if (currentApp.isFree && app.isFree) return Math.random() > 0.7;
      return false;
    })
    .slice(0, maxItems);

  if (relatedApps.length === 0) {
    return null;
  }

  return (
    <section className={className}>
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        You might also like
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {relatedApps.map((app) => (
          <Link
            key={app.id}
            href={`/${locale}/apps/${app.slug}`}
            className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
          >
            <StaticAppIcon app={app} size="sm" className="shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                {app.name}
              </h3>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {app.categoryName}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
