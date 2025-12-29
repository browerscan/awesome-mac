'use client';

import { useFavorites } from '@/hooks/useFavorites';
import { App } from '@/types';
import { AppCard } from '@/components/AppCard';
import { Suspense } from 'react';
import Link from 'next/link';

interface FavoritesClientProps {
  apps: App[];
  locale: string;
}

/**
 * Client-side component for favorites page
 * Handles localStorage-based favorites management
 */
export function FavoritesClient({ apps, locale }: FavoritesClientProps) {
  const { favorites, isLoaded } = useFavorites();

  // Get favorite app objects
  const favoriteApps = apps.filter((app) => favorites.has(app.slug));

  if (!isLoaded) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading favorites...</p>
        </div>
      </div>
    );
  }

  if (favoriteApps.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-12 dark:border-gray-700 dark:bg-gray-800">
        <svg
          className="mb-4 h-16 w-16 text-gray-400"
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
        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          No favorites yet
        </h2>
        <p className="mb-6 max-w-md text-center text-gray-600 dark:text-gray-400">
          Start exploring and save your favorite apps by clicking the heart icon on any app card.
        </p>
        <Link href={`/${locale}`} className="btn btn-primary inline-flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Explore Apps
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Bar */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {favoriteApps.length} {favoriteApps.length === 1 ? 'app' : 'apps'} saved
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/${locale}/setup-builder`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Create Setup
            </Link>
          </div>
        </div>
      </div>

      {/* Favorites Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {favoriteApps.map((app) => (
          <Suspense key={app.id} fallback={<AppCardSkeleton />}>
            <AppCard app={app} />
          </Suspense>
        ))}
      </div>

      {/* Tips Section */}
      <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Pro Tip
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Your favorites are stored locally in your browser. They will persist across sessions but
          are specific to this device. Use the "Create Setup" button to generate a shareable list of
          your favorite apps!
        </p>
      </div>
    </div>
  );
}

// Loading skeleton
function AppCardSkeleton() {
  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 h-12 w-12 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mb-4 h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mb-4 h-6 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mt-auto h-4 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}
