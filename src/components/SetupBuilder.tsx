'use client';

import { useState } from 'react';
import Link from 'next/link';
import { App } from '@/types';
import { StaticAppIcon } from './AppIcon';

interface SetupBuilderProps {
  apps: App[];
  className?: string;
}

/**
 * SetupBuilder Component
 *
 * Allows users to select apps for their "My Mac Setup"
 * and generates a shareable URL with the encoded app list.
 * Uses Base64 encoding to create shareable setup URLs.
 */
export function SetupBuilder({ apps, className = '' }: SetupBuilderProps) {
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [setupName, setSetupName] = useState('My Mac Setup');

  const toggleApp = (appSlug: string) => {
    setSelectedApps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(appSlug)) {
        newSet.delete(appSlug);
      } else {
        newSet.add(appSlug);
      }
      return newSet;
    });
  };

  const generateShareableUrl = () => {
    if (selectedApps.size === 0) return '#';

    // Create setup data object
    const setupData = {
      name: setupName,
      apps: Array.from(selectedApps),
      createdAt: new Date().toISOString(),
    };

    // Encode to Base64
    const encoded = btoa(JSON.stringify(setupData));
    return `/setup/${encoded}`;
  };

  const shareableUrl = generateShareableUrl();
  const canShare = selectedApps.size > 0;

  // Get selected app objects
  const selectedAppObjects = apps.filter((app) => selectedApps.has(app.slug));

  return (
    <div
      className={`rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Mac Setup</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select apps to create and share your setup
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {selectedApps.size}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">apps selected</div>
        </div>
      </div>

      {/* Setup Name Input */}
      <div className="mb-4">
        <label
          htmlFor="setup-name"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Setup Name
        </label>
        <input
          id="setup-name"
          type="text"
          value={setupName}
          onChange={(e) => setSetupName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder="My Mac Setup"
        />
      </div>

      {/* Selected Apps Preview */}
      {selectedAppObjects.length > 0 && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-white p-4 dark:border-blue-800 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Selected Apps
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {selectedAppObjects.map((app) => (
              <div
                key={app.id}
                className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-700"
              >
                <StaticAppIcon app={app} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-white">
                  {app.name}
                </span>
                <button
                  onClick={() => toggleApp(app.slug)}
                  className="rounded-full p-1 text-gray-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  aria-label={`Remove ${app.name}`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Button */}
      <div className="mb-6">
        {canShare ? (
          <Link
            href={shareableUrl}
            className="btn btn-primary inline-flex w-full items-center justify-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Generate Shareable Link
          </Link>
        ) : (
          <button
            disabled
            className="btn inline-flex w-full cursor-not-allowed items-center justify-center gap-2 opacity-50"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Select apps to generate link
          </button>
        )}
      </div>

      {/* App Selection List */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Browse Apps</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {apps.slice(0, 20).map((app) => {
            const isSelected = selectedApps.has(app.slug);
            return (
              <button
                key={app.id}
                onClick={() => toggleApp(app.slug)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600 dark:hover:bg-gray-700'
                }`}
              >
                <div className="relative">
                  <StaticAppIcon app={app} size="sm" />
                  {isSelected && (
                    <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {app.name}
                  </div>
                  <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {app.categoryName}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {apps.length > 20 && (
          <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
            Showing 20 of {apps.length} apps
          </p>
        )}
      </div>
    </div>
  );
}
