import { NextResponse } from 'next/server';
import { getAllApps, getCategories } from '@/lib/data';
import fs from 'fs/promises';
import path from 'path';
import { applyCorsHeaders } from '@/lib/cors';
import { applySecurityHeaders } from '@/lib/security-headers';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
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
    };
    memory: {
      status: 'pass' | 'warn';
      used: string;
      total: string;
      percentage: number;
    };
  };
}

/**
 * GET /api/health - Health check endpoint for monitoring
 *
 * This endpoint provides comprehensive health status for:
 * - Data file availability
 * - Data sync status
 * - Memory usage
 *
 * Returns HTTP 200 for healthy/degraded, 503 for unhealthy
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const health: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      dataFiles: {
        status: 'pass',
        files: {
          awesomeMacJson: false,
          awesomeMacZhJson: false,
        },
      },
      dataSync: {
        status: 'pass',
      },
      memory: {
        status: 'pass',
        used: '0',
        total: '0',
        percentage: 0,
      },
    },
  };

  let hasFailures = false;
  let hasWarnings = false;

  // Check 1: Data files availability
  try {
    const distPath = path.join(process.cwd(), 'dist');
    const [enStats, zhStats] = await Promise.all([
      fs.stat(path.join(distPath, 'awesome-mac.json')).catch(() => null),
      fs.stat(path.join(distPath, 'awesome-mac.zh.json')).catch(() => null),
    ]);

    health.checks.dataFiles.files.awesomeMacJson = !!enStats;
    health.checks.dataFiles.files.awesomeMacZhJson = !!zhStats;

    if (!enStats || !zhStats) {
      health.checks.dataFiles.status = 'fail';
      hasFailures = true;
    }

    // Check file ages (warn if older than 24 hours)
    const fileAge = Date.now() - (enStats?.mtimeMs || 0);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (fileAge > maxAge) {
      hasWarnings = true;
    }
  } catch (error) {
    health.checks.dataFiles.status = 'fail';
    hasFailures = true;
  }

  // Check 2: Data sync status (check JSON data files directly)
  try {
    const apps = await getAllApps();
    const categories = await getCategories();

    if (apps.length === 0 || categories.length === 0) {
      health.checks.dataSync = {
        status: 'fail',
        totalApps: apps.length,
        totalCategories: categories.length,
        message: 'No data found in JSON files',
      };
      hasFailures = true;
    } else {
      health.checks.dataSync = {
        status: 'pass',
        totalApps: apps.length,
        totalCategories: categories.length,
      };
    }
  } catch (error) {
    health.checks.dataSync = {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Data sync check failed',
    };
    hasFailures = true;
  }

  // Check 3: Memory usage
  const memUsage = process.memoryUsage();
  const memUsed = memUsage.heapUsed / 1024 / 1024;
  const memTotal = memUsage.heapTotal / 1024 / 1024;
  const memPercentage = (memUsed / memTotal) * 100;

  health.checks.memory = {
    status: memPercentage > 90 ? 'warn' : 'pass',
    used: `${memUsed.toFixed(2)} MB`,
    total: `${memTotal.toFixed(2)} MB`,
    percentage: Math.round(memPercentage),
  };

  if (memPercentage > 90) {
    hasWarnings = true;
  }

  // Determine overall status
  if (hasFailures) {
    health.status = 'unhealthy';
  } else if (hasWarnings) {
    health.status = 'degraded';
  }

  const responseTime = Date.now() - startTime;

  // Create response with appropriate status code
  const statusCode = health.status === 'unhealthy' ? 503 : 200;
  const response = NextResponse.json(health, { status: statusCode });

  // Add headers
  applyCorsHeaders(req, response);
  applySecurityHeaders(response);
  response.headers.set('X-Health-Check-Duration', `${responseTime}ms`);
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

  return response;
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  applyCorsHeaders(req, response);
  applySecurityHeaders(response);
  return response;
}
