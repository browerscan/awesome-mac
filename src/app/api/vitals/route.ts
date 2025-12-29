import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { rateLimiters, getClientIp, createRateLimitResponse } from '@/lib/rate-limit';
import { applyCorsHeaders } from '@/lib/cors';
import { applySecurityHeaders } from '@/lib/security-headers';
import { safeJsonParse } from '@/lib/validation';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Web Vitals validation schema
const webVitalsSchema = z.object({
  name: z.enum(['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP', 'TTFB']),
  value: z.number().min(0).max(60000), // Max 60 seconds
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  delta: z.number().min(0).max(60000).optional(),
  id: z.string().max(100),
  page: z.string().max(500).url().or(z.literal('/')).or(z.string().startsWith('/')),
});

interface WebVitalsBody {
  name: string;
  value: number;
  rating: string;
  delta: number;
  id: string;
  page: string;
}

// In-memory storage for vitals aggregation
const vitalsBuffer: Map<string, WebVitalsBody[]> = new Map();

// Send to Google Analytics 4 via Measurement Protocol
async function sendToGA4(metric: WebVitalsBody): Promise<void> {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA_MEASUREMENT_PROTOCOL_SECRET;

  if (!measurementId || !apiSecret) {
    return;
  }

  const clientId = metric.id; // Use metric ID as client identifier

  // GA4 Measurement Protocol v2 event format
  const body = JSON.stringify({
    client_id: clientId,
    events: [
      {
        name: 'web_vitals',
        params: {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          page: metric.page,
          engagement_time_msec: 1,
        },
      },
    ],
  });

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error('[vitals] GA4 upload failed:', await response.text());
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[vitals] GA4 upload error:', error);
  }
}

// Aggregate metrics before sending (helps with quota limits)
function aggregateMetrics(name: string): {
  count: number;
  avgValue: number;
  distribution: { good: number; needsImprovement: number; poor: number };
} {
  const metrics = vitalsBuffer.get(name) || [];
  if (metrics.length === 0) {
    return {
      count: 0,
      avgValue: 0,
      distribution: { good: 0, needsImprovement: 0, poor: 0 },
    };
  }

  const sum = metrics.reduce((acc, m) => acc + m.value, 0);
  const avgValue = sum / metrics.length;

  const distribution = metrics.reduce(
    (acc, m) => {
      if (m.rating === 'good') acc.good++;
      else if (m.rating === 'needs-improvement') acc.needsImprovement++;
      else acc.poor++;
      return acc;
    },
    { good: 0, needsImprovement: 0, poor: 0 }
  );

  return { count: metrics.length, avgValue, distribution };
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

export async function POST(req: NextRequest) {
  // Apply security headers
  const response = new NextResponse(null, { status: 204 });
  applyCorsHeaders(req, response);
  applySecurityHeaders(response);

  // Rate limiting check - use stricter limits for vitals
  const clientId = getClientIp(req);
  const rateLimitResult = await rateLimiters.write.check(clientId);

  if (!rateLimitResult.success) {
    const rateLimitResponse = createRateLimitResponse(rateLimitResult);
    applyCorsHeaders(req, rateLimitResponse);
    applySecurityHeaders(rateLimitResponse);
    return rateLimitResponse;
  }

  // Validate content type
  const contentType = req.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const errorResponse = NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    applyCorsHeaders(req, errorResponse);
    applySecurityHeaders(errorResponse);
    return errorResponse;
  }

  try {
    // Read and validate body size
    const rawBody = await req.text();
    if (rawBody.length > 10000) {
      // 10KB limit
      const errorResponse = NextResponse.json({ error: 'Request body too large' }, { status: 413 });
      applyCorsHeaders(req, errorResponse);
      applySecurityHeaders(errorResponse);
      return errorResponse;
    }

    // Parse and validate with Zod
    const parseResult = safeJsonParse(rawBody, webVitalsSchema);
    if (!parseResult.success) {
      const errorResponse = NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error },
        { status: 400 }
      );
      applyCorsHeaders(req, errorResponse);
      applySecurityHeaders(errorResponse);
      return errorResponse;
    }

    const body = parseResult.data as WebVitalsBody;

    // Log in development
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[vitals]', {
        name: body.name,
        value: body.value,
        rating: body.rating,
        page: body.page,
      });
    }

    // Send directly to GA4 in production
    if (process.env.NODE_ENV === 'production') {
      // Non-blocking send
      sendToGA4(body).catch((error) => {
        // eslint-disable-next-line no-console
        console.error('[vitals] Failed to send metric:', error);
      });

      // Also buffer for potential aggregation
      const metrics = vitalsBuffer.get(body.name) || [];
      metrics.push(body);
      vitalsBuffer.set(body.name, metrics);

      // Keep buffer size manageable
      if (metrics.length > 100) {
        metrics.shift();
      }
    }

    return response;
  } catch (error) {
    const errorResponse = NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    applyCorsHeaders(req, errorResponse);
    applySecurityHeaders(errorResponse);
    return errorResponse;
  }
}

// GET endpoint for monitoring vitals health (admin/debug use)
export async function GET(req: NextRequest) {
  const response = NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  applyCorsHeaders(req, response);
  applySecurityHeaders(response);
  return response;

  // Uncomment below to enable monitoring endpoint with authentication
  /*
  const metrics = ["LCP", "FID", "CLS", "FCP", "TTFB", "INP"];
  const summary: Record<
    string,
    {
      count: number;
      avgValue: number;
      distribution: { good: number; needsImprovement: number; poor: number };
    }
  > = {};

  for (const metric of metrics) {
    summary[metric] = aggregateMetrics(metric);
  }

  const successResponse = NextResponse.json({
    timestamp: new Date().toISOString(),
    metrics: summary,
  });
  applyCorsHeaders(req, successResponse);
  applySecurityHeaders(successResponse);
  return successResponse;
  */
}
