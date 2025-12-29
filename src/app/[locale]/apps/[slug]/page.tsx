import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getAppBySlug, getAllAppSlugs, getCategoryById, getAllApps } from '@/lib/data';
import { generateAppMetadata } from '@/lib/seo';
import { AppPageJsonLd } from '@/components/seo/JsonLd';
import { StaticAppIcon } from '@/components/AppIcon';
import { AppBadges } from '@/components/Badge';
import { ScreenshotGallery, ScreenshotGalleryPlaceholder } from '@/components/ScreenshotGallery';
import { ShareButtons } from '@/components/ShareButtons';
import { RelatedAppsHorizontal } from '@/components/RelatedApps';
import type { Screenshot } from '@/components/ScreenshotGallery';

interface AppPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

/**
 * Generate static params for all apps
 */
export async function generateStaticParams() {
  const slugs = await getAllAppSlugs();
  const locales = ['en', 'zh'];
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

/**
 * Generate metadata for the app page
 */
export async function generateMetadata({ params }: AppPageProps): Promise<Metadata> {
  const { slug } = await params;
  const app = await getAppBySlug(slug);

  if (!app) {
    return {
      title: 'App Not Found',
      description: 'The requested application could not be found.',
    };
  }

  return generateAppMetadata(app);
}

/**
 * App detail page component
 */
export default async function AppPage({ params }: AppPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'app' });
  const commonT = await getTranslations({ locale, namespace: 'common' });
  const app = await getAppBySlug(slug);

  if (!app) {
    notFound();
  }

  const category = await getCategoryById(app.categoryId);
  const parentCategory = app.parentCategoryId
    ? await getCategoryById(app.parentCategoryId)
    : undefined;

  // Get related apps for internal linking
  const allApps = await getAllApps();
  const relatedApps = allApps
    .filter((a) => a.categoryId === app.categoryId && a.id !== app.id)
    .slice(0, 4);

  // Build share URL
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'}/${locale}/apps/${app.slug}`;

  // Demo screenshots - in a real app, these would come from the app data
  const screenshots: Screenshot[] = [];

  const breadcrumbs = [
    { name: commonT('home'), href: `/${locale}` },
    ...(parentCategory
      ? [
          {
            name: parentCategory.name,
            href: `/${locale}/category/${parentCategory.slug}`,
          },
        ]
      : []),
    {
      name: app.categoryName,
      href: `/${locale}/category/${category?.slug || app.categoryId}`,
    },
    { name: app.name, href: `/${locale}/apps/${app.slug}` },
  ];

  return (
    <>
      {/* Structured Data */}
      <AppPageJsonLd app={app} breadcrumbs={breadcrumbs} />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Breadcrumb Navigation */}
        <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <li key={item.href} className="flex items-center">
                {index > 0 && (
                  <svg
                    className="mx-2 h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-gray-500 dark:text-gray-400">{item.name}</span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* App Header */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              {/* App Icon */}
              <StaticAppIcon app={app} size="xl" className="shrink-0" />

              {/* App Info */}
              <div className="flex-1">
                <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {app.name}
                </h1>

                <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">
                  {app.description || t('noDescription')}
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
                  className="mb-6"
                />

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    {t('visitWebsite')}
                    <svg
                      className="ml-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>

                  {app.isAppStore && app.appStoreUrl && (
                    <a
                      href={app.appStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                    >
                      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
                      {t('appStore')}
                    </a>
                  )}

                  {app.isOpenSource && app.ossUrl && (
                    <a
                      href={app.ossUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path
                          fillRule="evenodd"
                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t('viewSource')}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
              <ShareButtons
                url={shareUrl}
                title={`${app.name} - Awesome Mac`}
                description={app.description}
              />
            </div>

            {/* Screenshot Gallery */}
            {screenshots.length > 0 ? (
              <div className="mt-8">
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  {t('screenshots')}
                </h2>
                <ScreenshotGallery screenshots={screenshots} appName={app.name} />
              </div>
            ) : (
              <div className="mt-8">
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  {t('screenshots')}
                </h2>
                <ScreenshotGalleryPlaceholder />
              </div>
            )}

            {/* Category Info */}
            <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                {t('category')}
              </h2>
              <div className="flex items-center gap-2">
                {parentCategory && (
                  <>
                    <Link
                      href={`/${locale}/category/${parentCategory.slug}`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {parentCategory.name}
                    </Link>
                    <span className="text-gray-400">/</span>
                  </>
                )}
                <Link
                  href={`/${locale}/category/${category?.slug || app.categoryId}`}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {app.categoryName}
                </Link>
              </div>
            </div>
          </div>

          {/* Related Apps */}
          {relatedApps.length > 0 && (
            <div className="mt-8">
              <RelatedAppsHorizontal currentApp={app} allApps={allApps} maxItems={4} />
            </div>
          )}
        </main>
      </div>
    </>
  );
}
