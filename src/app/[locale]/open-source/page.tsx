import { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getAllApps } from '@/lib/data';
import { AppPageJsonLd, BreadcrumbJsonLd, ItemListJsonLd } from '@/components/seo/JsonLd';
import { AppCard } from '@/components/AppCard';

interface OpenSourceAppsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Generate metadata for the open source apps page
 */
export async function generateMetadata({ params }: OpenSourceAppsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'openSource' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.title'),
      description: t('meta.description'),
    },
  };
}

/**
 * Open Source apps page component
 */
export default async function OpenSourceAppsPage({ params }: OpenSourceAppsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'openSource' });
  const commonT = await getTranslations({ locale, namespace: 'common' });

  const allApps = await getAllApps();
  const ossApps = allApps.filter((app) => app.isOpenSource);

  // Group by category for better organization
  const appsByCategory = new Map<string, typeof ossApps>();
  for (const app of ossApps) {
    const category = app.categoryName;
    if (!appsByCategory.has(category)) {
      appsByCategory.set(category, []);
    }
    appsByCategory.get(category)!.push(app);
  }

  const breadcrumbs = [
    { name: commonT('home'), href: `/${locale}` },
    { name: t('title'), href: `/${locale}/open-source` },
  ];

  return (
    <>
      {/* Structured Data */}
      <AppPageJsonLd
        app={{
          id: 'open-source-apps',
          slug: 'open-source-apps',
          name: t('title'),
          description: t('meta.description'),
          url: '/open-source',
          isFree: true,
          isOpenSource: true,
          isAppStore: false,
          hasAwesomeList: false,
          categoryId: 'open-source',
          categoryName: 'Open Source Apps',
        }}
        breadcrumbs={breadcrumbs}
      />
      <ItemListJsonLd items={ossApps} />
      <BreadcrumbJsonLd items={breadcrumbs} />

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

        {/* Page Header */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 rounded-lg bg-white p-8 shadow dark:bg-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                Open Source
              </span>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
            </div>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              {t('hero.description', { count: ossApps.length })}
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-500">{t('hero.note')}</p>

            {/* Quick Links */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/free`}
                className="inline-flex items-center rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
              >
                {t('links.freeApps')}
              </Link>
              <Link
                href={`/${locale}/apps`}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('links.browseAll')}
              </Link>
            </div>
          </div>

          {/* Apps by Category */}
          <div className="space-y-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('categories.title')}
            </h2>

            {Array.from(appsByCategory.entries()).map(([category, apps]) => (
              <div
                key={category}
                className="scroll-mt-20"
                id={category.toLowerCase().replace(/\s+/g, '-')}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    {category}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {apps.length} {t('apps', { count: apps.length })}
                  </span>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {apps.map((app) => (
                    <AppCard key={app.id} app={app} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* SEO Content Section */}
          <div className="mt-12 rounded-lg bg-white p-8 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              {t('content.whyTitle')}
            </h2>
            <div className="prose prose-gray max-w-none dark:prose-invert">
              <p>{t('content.intro')}</p>

              <h3 className="text-lg font-semibold mt-6 mb-3">{t('content.benefitsTitle')}</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('content.benefits.transparency')}</li>
                <li>{t('content.benefits.security')}</li>
                <li>{t('content.benefits.noLockIn')}</li>
                <li>{t('content.benefits.communityDriven')}</li>
                <li>{t('content.benefits.costEffective')}</li>
                <li>{t('content.benefits.longTerm')}</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">{t('content.licensesTitle')}</h3>
              <p>{t('content.licenses')}</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
