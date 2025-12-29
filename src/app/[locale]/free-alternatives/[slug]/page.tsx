import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getAllApps, getAppBySlug, getAppsByCategory } from '@/lib/data';
import { AppPageJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { AppCard } from '@/components/AppCard';

interface FreeAlternativePageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

/**
 * Generate static params for all apps
 */
export async function generateStaticParams() {
  const apps = await getAllApps();
  return apps.map((app) => ({ slug: app.slug }));
}

/**
 * Generate metadata for the free alternative page
 */
export async function generateMetadata({ params }: FreeAlternativePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'freeAlternatives' });
  const app = await getAppBySlug(slug);

  if (!app) {
    return {
      title: 'App Not Found',
      description: 'The requested application could not be found.',
    };
  }

  const isFree = app.isFree;
  const title = isFree
    ? t('meta.alreadyFreeTitle', { appName: app.name })
    : t('meta.title', { appName: app.name });
  const description = isFree
    ? t('meta.alreadyFreeDescription', { appName: app.name })
    : t('meta.description', { appName: app.name });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

/**
 * Free Alternatives page component
 */
export default async function FreeAlternativePage({ params }: FreeAlternativePageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'freeAlternatives' });
  const commonT = await getTranslations({ locale, namespace: 'common' });

  const app = await getAppBySlug(slug);

  if (!app) {
    notFound();
  }

  const allApps = await getAllApps();
  const categoryApps = await getAppsByCategory(app.categoryId);

  // Find free alternatives (excluding the app itself)
  const freeAlternatives = categoryApps
    .filter((a) => a.slug !== app.slug && a.isFree)
    .sort((a, b) => {
      // Prioritize open source
      const scoreA = a.isOpenSource ? 1 : 0;
      const scoreB = b.isOpenSource ? 1 : 0;
      return scoreB - scoreA;
    })
    .slice(0, 12);

  // Find open source alternatives
  const ossAlternatives = categoryApps
    .filter((a) => a.slug !== app.slug && a.isOpenSource)
    .slice(0, 12);

  const breadcrumbs = [
    { name: commonT('home'), href: `/${locale}` },
    { name: t('breadcrumb'), href: `/${locale}/free` },
    { name: app.name, href: `/${locale}/free-alternatives/${app.slug}` },
  ];

  return (
    <>
      {/* Structured Data */}
      <AppPageJsonLd
        app={{
          id: `free-alt-${app.id}`,
          slug: `free-alt-${app.slug}`,
          name: t('pageTitle', { appName: app.name }),
          description: t('pageDescription', { appName: app.name }),
          url: `/free-alternatives/${app.slug}`,
          isFree: true,
          isOpenSource: false,
          isAppStore: false,
          hasAwesomeList: false,
          categoryId: app.categoryId,
          categoryName: app.categoryName,
        }}
        breadcrumbs={breadcrumbs}
      />
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
          <div className="mb-8 rounded-lg bg-gradient-to-br from-green-600 to-emerald-700 p-8 text-white shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-4">
                  {app.isFree
                    ? t('title.alreadyFree', { appName: app.name })
                    : t('title.paidApp', { appName: app.name })}
                </h1>
                <p className="text-green-50">
                  {app.isFree ? t('hero.alreadyFree') : t('hero.paidApp', { appName: app.name })}
                </p>
              </div>

              {/* Original App Card */}
              <div className="rounded-lg bg-white/10 backdrop-blur-sm p-4 md:w-64">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/20 text-xl font-bold">
                    {app.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{app.name}</h3>
                    <p className="text-sm text-green-100">{app.categoryName}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {app.isFree && (
                    <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                      {commonT('free')}
                    </span>
                  )}
                  {app.isOpenSource && (
                    <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                      {commonT('openSource')}
                    </span>
                  )}
                  {!app.isFree && (
                    <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                      {t('paid')}
                    </span>
                  )}
                </div>
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg bg-white px-4 py-2 text-center text-sm font-medium text-green-700 hover:bg-green-50"
                >
                  {t('visitWebsite')}
                </a>
              </div>
            </div>
          </div>

          {/* Free Alternatives Section */}
          {freeAlternatives.length > 0 && (
            <div className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('sections.freeAlternatives')}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {freeAlternatives.length} {commonT('apps', { count: freeAlternatives.length })}
                </span>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {freeAlternatives.map((alt) => (
                  <AppCard key={alt.id} app={alt} />
                ))}
              </div>
            </div>
          )}

          {/* Open Source Alternatives Section */}
          {ossAlternatives.length > 0 && (
            <div className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('sections.ossAlternatives')}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {ossAlternatives.length} {commonT('apps', { count: ossAlternatives.length })}
                </span>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {ossAlternatives.map((alt) => (
                  <AppCard key={alt.id} app={alt} />
                ))}
              </div>
            </div>
          )}

          {/* No Alternatives Message */}
          {freeAlternatives.length === 0 && ossAlternatives.length === 0 && (
            <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400 mb-4">{t('noAlternatives')}</p>
              <Link
                href={`/${locale}/free`}
                className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t('browseAllFree')}
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          )}

          {/* SEO Content Section */}
          <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              {t('content.whyTitle', { appName: app.name })}
            </h2>
            <div className="prose prose-gray max-w-none dark:prose-invert">
              <p>{t('content.intro', { appName: app.name })}</p>

              <h3 className="text-lg font-semibold mt-6 mb-3">{t('content.benefitsTitle')}</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('content.benefits.noFees')}</li>
                <li>{t('content.benefits.transparency')}</li>
                <li>{t('content.benefits.communitySupport')}</li>
                <li>{t('content.benefits.noLockIn')}</li>
                <li>{t('content.benefits.regularUpdates')}</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">{t('content.howToChooseTitle')}</h3>
              <p>{t('content.howToChoose', { appName: app.name })}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/open-source`}
                className="inline-flex items-center rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
              >
                {t('links.allOssApps')}
              </Link>
              <Link
                href={`/${locale}/category/${app.categoryName.toLowerCase().replace(/\s+/g, '-')}`}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('links.moreCategory', { category: app.categoryName })}
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
