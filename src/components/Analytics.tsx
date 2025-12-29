'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useEffect, Suspense } from 'react';
import type { JSX } from 'react';

/**
 * Google Analytics configuration
 */
interface AnalyticsConfig {
  measurementId: string;
  debug?: boolean;
}

/**
 * Get analytics configuration from environment
 */
function getAnalyticsConfig(): AnalyticsConfig | null {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) return null;

  return {
    measurementId,
    debug: process.env.NODE_ENV === 'development',
  };
}

/**
 * Send page view to Google Analytics
 */
function sendPageView(url: string, measurementId: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', measurementId, {
      page_path: url,
    });
  }
}

/**
 * Track custom event
 */
export function trackEvent(action: string, category: string, label?: string, value?: number): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

/**
 * Track app click
 */
export function trackAppClick(appName: string, appUrl: string): void {
  trackEvent('click', 'App', appName);
  trackEvent('outbound_link', 'External', appUrl);
}

/**
 * Track category view
 */
export function trackCategoryView(categoryName: string): void {
  trackEvent('view', 'Category', categoryName);
}

/**
 * Track search query
 */
export function trackSearch(query: string, resultsCount: number): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'search', {
      search_term: query,
      results_count: resultsCount,
    });
  }
}

/**
 * Track filter usage
 */
export function trackFilter(filterType: string, filterValue: string): void {
  trackEvent('filter', filterType, filterValue);
}

/**
 * Track sponsored link click
 */
export function trackSponsoredClick(sponsorName: string, destinationUrl: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'sponsored_click', {
      sponsor_name: sponsorName,
      destination_url: destinationUrl,
      link_type: 'sponsored',
    });
  }
}

/**
 * Track external app visit (website visit from app card)
 */
export function trackExternalVisit(
  appName: string,
  destinationUrl: string,
  linkType: 'website' | 'app_store' | 'github' | 'awesome_list'
): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'external_visit', {
      app_name: appName,
      destination_url: destinationUrl,
      link_type: linkType,
    });
  }
}

/**
 * Track language switch
 */
export function trackLanguageSwitch(from: string, to: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'language_switch', {
      from_language: from,
      to_language: to,
    });
  }
}

/**
 * Track app detail view
 */
export function trackAppDetailView(appName: string, categoryName: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_item', {
      item_name: appName,
      item_category: categoryName,
      item_list_name: categoryName,
    });
  }
}

/**
 * Track GitHub link click
 */
export function trackGitHubClick(repoName: string): void {
  trackEvent('github_click', 'External', repoName);
}

/**
 * Analytics page view tracker component
 */
function AnalyticsPageViewTracker(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const config = getAnalyticsConfig();

  useEffect(() => {
    if (!config) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    sendPageView(url, config.measurementId);
  }, [pathname, searchParams, config]);

  return null;
}

/**
 * Google Analytics 4 component
 */
export function Analytics(): JSX.Element | null {
  const config = getAnalyticsConfig();

  if (!config) {
    return null;
  }

  return (
    <>
      {/* Google Analytics Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${config.measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${config.measurementId}', {
            page_path: window.location.pathname,
            ${config.debug ? 'debug_mode: true,' : ''}
          });
        `}
      </Script>

      {/* Page view tracker */}
      <Suspense fallback={null}>
        <AnalyticsPageViewTracker />
      </Suspense>
    </>
  );
}

/**
 * Type declaration for gtag
 */
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'consent',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}

/**
 * Consent management utilities
 */
export function grantAnalyticsConsent(): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
    });
  }
}

export function denyAnalyticsConsent(): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
    });
  }
}

/**
 * Check if analytics consent was given
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('analytics_consent') === 'granted';
}

/**
 * Save analytics consent preference
 */
export function saveAnalyticsConsent(granted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('analytics_consent', granted ? 'granted' : 'denied');
  if (granted) {
    grantAnalyticsConsent();
  } else {
    denyAnalyticsConsent();
  }
}

/**
 * Initialize consent-based analytics
 */
export function initConsentAnalytics(): void {
  if (typeof window === 'undefined') return;

  const consent = localStorage.getItem('analytics_consent');
  if (consent === 'granted') {
    grantAnalyticsConsent();
  } else if (consent === 'denied') {
    denyAnalyticsConsent();
  }
  // If no consent stored, show consent banner
}

export default Analytics;
