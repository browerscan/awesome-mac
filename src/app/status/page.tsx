/**
 * Status Page Component
 * Public-facing status page for health monitoring
 */

import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      responseTime?: number;
    };
    dataFiles: {
      status: 'pass' | 'fail';
      files: {
        awesomeMacJson: boolean;
        awesomeMacZhJson: boolean;
      };
    };
    dataSync: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      totalCategories?: number;
      totalApps?: number;
      lastSync?: string | null;
    };
    memory: {
      status: 'pass' | 'warn';
      used: string;
      total: string;
      percentage: number;
    };
  };
}

async function getHealthStatus(): Promise<HealthStatus> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/health`, {
    cache: 'no-store',
  });
  return response.json();
}

function StatusBadge({
  status,
}: {
  status: 'pass' | 'fail' | 'warn' | 'healthy' | 'degraded' | 'unhealthy';
}) {
  const styles = {
    pass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    fail: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    warn: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    healthy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    degraded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    unhealthy: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const labels = {
    pass: 'Pass',
    fail: 'Fail',
    warn: 'Warning',
    healthy: 'Healthy',
    degraded: 'Degraded',
    unhealthy: 'Unhealthy',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

async function StatusCard() {
  const health = await getHealthStatus();
  const t = await getTranslations('status');

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Overall Status */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Awesome Mac Status</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Last checked: {new Date(health.timestamp).toLocaleString()}
            </p>
          </div>
          <StatusBadge status={health.status} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Version:</span>{' '}
            <span className="font-medium text-gray-900 dark:text-white">{health.version}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Uptime:</span>{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
            </span>
          </div>
        </div>
      </div>

      {/* Individual Checks */}
      <div className="space-y-4">
        {/* Database */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Database</h3>
            <StatusBadge status={health.checks.database.status} />
          </div>
          {health.checks.database.message && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {health.checks.database.message}
            </p>
          )}
          {health.checks.database.responseTime && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Response time: {health.checks.database.responseTime}ms
            </p>
          )}
        </div>

        {/* Data Files */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Data Files</h3>
            <StatusBadge status={health.checks.dataFiles.status} />
          </div>
          <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-2">
              <span
                className={
                  health.checks.dataFiles.files.awesomeMacJson ? 'text-green-500' : 'text-red-500'
                }
              >
                {health.checks.dataFiles.files.awesomeMacJson ? '✓' : '✗'}
              </span>
              awesome-mac.json
            </li>
            <li className="flex items-center gap-2">
              <span
                className={
                  health.checks.dataFiles.files.awesomeMacZhJson ? 'text-green-500' : 'text-red-500'
                }
              >
                {health.checks.dataFiles.files.awesomeMacZhJson ? '✓' : '✗'}
              </span>
              awesome-mac.zh.json
            </li>
          </ul>
        </div>

        {/* Data Sync */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Data Sync</h3>
            <StatusBadge status={health.checks.dataSync.status} />
          </div>
          {health.checks.dataSync.message && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {health.checks.dataSync.message}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span>Categories: </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {health.checks.dataSync.totalCategories || 'N/A'}
              </span>
            </div>
            <div>
              <span>Apps: </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {health.checks.dataSync.totalApps || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Memory */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Memory</h3>
            <StatusBadge status={health.checks.memory.status} />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${health.checks.memory.percentage}%` }}
                />
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {health.checks.memory.used} / {health.checks.memory.total} (
              {health.checks.memory.percentage}%)
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Link */}
      <div className="mt-6 text-center">
        <a
          href="/status"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Refresh Status
        </a>
      </div>
    </div>
  );
}

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <Suspense fallback={<div className="text-center text-gray-500">Loading status...</div>}>
        <StatusCard />
      </Suspense>
    </div>
  );
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
