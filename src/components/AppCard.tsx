'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { App } from '@/types';
import { trackExternalVisit } from '@/components/Analytics';
import { StaticAppIcon } from './AppIcon';
import { AppBadges } from './Badge';
import { Suspense } from 'react';
import { useFavorites } from '@/hooks/useFavorites';

interface AppCardProps {
  app: App;
}

/**
 * AppCard Component
 *
 * Displays an app with its icon, name, description, and badges.
 * Supports real app icons fetched from multiple sources.
 */
export function AppCard({ app }: AppCardProps) {
  const locale = useLocale();
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleExternalLinkClick = (
    url: string,
    linkType: 'website' | 'app_store' | 'github' | 'awesome_list'
  ) => {
    trackExternalVisit(app.name, url, linkType);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(app.slug);
  };

  const favorited = isFavorite(app.slug);

  return (
    <div className="group relative flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600">
      {/* Favorite Button */}
      <button
        onClick={handleFavoriteClick}
        className="absolute right-3 top-3 z-10 rounded-lg p-2 transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg
          className={`h-5 w-5 transition-all ${
            favorited ? 'fill-red-500 text-red-500' : 'fill-none text-gray-400 hover:text-red-500'
          }`}
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>

      {/* App Icon */}
      <div className="mb-4">
        <Suspense fallback={<AppIconSkeleton />}>
          <StaticAppIcon app={app} size="md" />
        </Suspense>
      </div>

      {/* App Name */}
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        <Link
          href={`/${locale}/apps/${app.slug}`}
          className="hover:text-blue-600 dark:hover:text-blue-400"
        >
          {app.name}
        </Link>
      </h3>

      {/* Description */}
      <p className="mb-4 flex-grow text-sm text-gray-600 line-clamp-3 dark:text-gray-400">
        {app.description || 'No description available.'}
      </p>

      {/* Badges */}
      <AppBadges
        isFree={app.isFree}
        isOpenSource={app.isOpenSource}
        isAppStore={app.isAppStore}
        hasAwesomeList={app.hasAwesomeList}
        ossUrl={app.ossUrl}
        appStoreUrl={app.appStoreUrl}
        awesomeListUrl={app.awesomeListUrl}
        className="mb-4"
      />

      {/* View Details Link */}
      <div className="mt-auto flex items-center justify-between gap-3">
        <Link
          href={`/${locale}/apps/${app.slug}`}
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View Details
          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleExternalLinkClick(app.url, 'website')}
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          Visit
        </a>
      </div>
    </div>
  );
}

// Loading skeleton for app icon
function AppIconSkeleton() {
  return (
    <div className="h-12 w-12 animate-pulse rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
  );
}

/**
 * Compact version for grids with smaller cards
 */
interface AppCardCompactProps {
  app: App;
}

export function AppCardCompact({ app }: AppCardCompactProps) {
  const locale = useLocale();

  return (
    <Link
      href={`/${locale}/apps/${app.slug}`}
      className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
    >
      <StaticAppIcon app={app} size="sm" className="shrink-0" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
          {app.name}
        </h3>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{app.categoryName}</p>
      </div>
      <AppBadges
        isFree={app.isFree}
        isOpenSource={app.isOpenSource}
        isAppStore={app.isAppStore}
        hasAwesomeList={app.hasAwesomeList}
        className="shrink-0 !gap-1"
      />
    </Link>
  );
}
