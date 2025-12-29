'use client';

import Link from 'next/link';
import { StaticAppIcon } from '@/components/AppIcon';
import { AppBadges } from '@/components/Badge';
import { ShareButtons } from '@/components/ShareButtons';
import { useState, useEffect } from 'react';
import { App } from '@/types';

interface SetupClientProps {
  setupData: {
    name?: string;
    apps?: string[];
    createdAt?: string;
  };
  apps: App[];
  locale: string;
}

export function SetupClient({ setupData, apps, locale }: SetupClientProps) {
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const setupName = setupData.name || 'My Mac Setup';
  const createdAt = setupData.createdAt ? new Date(setupData.createdAt).toLocaleDateString() : null;

  // Group apps by category
  const appsByCategory = apps.reduce(
    (acc, app) => {
      if (!acc[app.categoryName]) {
        acc[app.categoryName] = [];
      }
      acc[app.categoryName].push(app);
      return acc;
    },
    {} as Record<string, App[]>
  );

  const categories = Object.keys(appsByCategory);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Home
            </Link>
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{setupName}</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {apps.length} {apps.length === 1 ? 'app' : 'apps'} in this setup
                {createdAt && ` • Created ${createdAt}`}
              </p>
            </div>

            <div>
              <ShareButtons url={currentUrl} title={setupName} />
            </div>
          </div>
        </main>
      </div>

      {/* Setup Stats */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{apps.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Apps</div>
          </div>
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {categories.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {apps.filter((app) => app.isFree).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Free Apps</div>
          </div>
        </div>

        {/* Apps by Category */}
        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">{category}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {appsByCategory[category].map((app) => (
                <div
                  key={app.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start gap-4">
                    <StaticAppIcon app={app} size="lg" className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        <Link
                          href={`/${locale}/apps/${app.slug}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {app.name}
                        </Link>
                      </h3>
                      <p className="mb-2 mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {app.description || 'No description available.'}
                      </p>
                      <AppBadges
                        isFree={app.isFree}
                        isOpenSource={app.isOpenSource}
                        isAppStore={app.isAppStore}
                        hasAwesomeList={app.hasAwesomeList}
                        ossUrl={app.ossUrl}
                        appStoreUrl={app.appStoreUrl}
                        awesomeListUrl={app.awesomeListUrl}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Create Your Own CTA */}
        <div className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Create Your Own Setup
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Build and share your own Mac app setup with the community
          </p>
          <Link
            href={`/${locale}/favorites`}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Get Started
          </Link>
        </div>
      </main>
    </div>
  );
}
