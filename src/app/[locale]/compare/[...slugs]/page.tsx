import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getAllApps, getAppBySlug } from '@/lib/data';
import { AppPageJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { AppCard } from '@/components/AppCard';

interface ComparePageProps {
  params: Promise<{
    locale: string;
    slugs: string[];
  }>;
}

/**
 * Generate metadata for the comparison page
 */
export async function generateMetadata({ params }: ComparePageProps): Promise<Metadata> {
  const { locale, slugs } = await params;
  const t = await getTranslations({ locale, namespace: 'compare' });

  if (slugs.length < 2 || slugs.length > 4) {
    return {
      title: t('meta.invalidTitle'),
      description: t('meta.invalidDescription'),
    };
  }

  const apps = await Promise.all(slugs.map((slug) => getAppBySlug(slug)));
  const validApps = apps.filter((app): app is NonNullable<typeof app> => app !== undefined);

  if (validApps.length < 2) {
    return {
      title: t('meta.notFoundTitle'),
      description: t('meta.notFoundDescription'),
    };
  }

  const appNames = validApps.map((app) => app.name).join(' vs ');
  const title = t('meta.title', { appNames });
  const description = t('meta.description', {
    appNames: validApps.map((app) => app.name).join(' and '),
  });

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
 * Comparison page component
 */
export default async function ComparePage({ params }: ComparePageProps) {
  const { locale, slugs } = await params;
  const t = await getTranslations({ locale, namespace: 'compare' });
  const commonT = await getTranslations({ locale, namespace: 'common' });

  // Validate number of apps to compare
  if (slugs.length < 2 || slugs.length > 4) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
            <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              {t('invalid.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('invalid.description')}</p>
            <Link
              href={`/${locale}/apps`}
              className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t('invalid.browseApps')}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const apps = await Promise.all(slugs.map((slug) => getAppBySlug(slug)));
  const validApps = apps.filter((app): app is NonNullable<typeof app> => app !== undefined);

  if (validApps.length < 2) {
    notFound();
  }

  const breadcrumbs = [
    { name: commonT('home'), href: `/${locale}` },
    { name: t('breadcrumb'), href: `/${locale}/compare` },
    {
      name: validApps.map((app) => app.name).join(' vs '),
      href: `/${locale}/compare/${slugs.join('/')}`,
    },
  ];

  // Comparison features
  const features = [
    {
      key: 'isFree',
      label: t('features.free'),
      getValue: (app: (typeof validApps)[0]) => app.isFree,
    },
    {
      key: 'isOpenSource',
      label: t('features.openSource'),
      getValue: (app: (typeof validApps)[0]) => app.isOpenSource,
    },
    {
      key: 'isAppStore',
      label: t('features.appStore'),
      getValue: (app: (typeof validApps)[0]) => app.isAppStore,
    },
    {
      key: 'category',
      label: t('features.category'),
      getValue: (app: (typeof validApps)[0]) => app.categoryName,
    },
  ];

  return (
    <>
      {/* Structured Data */}
      <AppPageJsonLd
        app={{
          id: 'compare',
          slug: 'compare',
          name: validApps.map((app) => app.name).join(' vs '),
          description: t('pageDescription', {
            appNames: validApps.map((app) => app.name).join(' and '),
          }),
          url: `/compare/${slugs.join('/')}`,
          isFree: false,
          isOpenSource: false,
          isAppStore: false,
          hasAwesomeList: false,
          categoryId: 'compare',
          categoryName: 'Comparison',
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
          <div className="mb-8 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-700 p-8 text-white shadow-lg">
            <h1 className="text-3xl font-bold mb-4">
              {validApps.length === 2 && (
                <span className="flex items-center justify-center gap-4">
                  {validApps[0].name}
                  <span className="text-indigo-200">vs</span>
                  {validApps[1].name}
                </span>
              )}
              {validApps.length > 2 && (
                <span>{t('title.multiple', { count: validApps.length })}</span>
              )}
            </h1>
            <p className="text-indigo-50">{t('hero.description')}</p>
          </div>

          {/* Comparison Table */}
          <div className="mb-8 rounded-lg bg-white shadow dark:bg-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      {t('table.feature')}
                    </th>
                    {validApps.map((app) => (
                      <th key={app.id} className="px-6 py-4 text-center">
                        <Link
                          href={`/${locale}/apps/${app.slug}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 text-2xl font-bold text-gray-500 dark:from-gray-700 dark:to-gray-600 dark:text-gray-400">
                            {app.name.charAt(0)}
                          </div>
                          <div className="mt-2 text-sm font-medium">{app.name}</div>
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature) => (
                    <tr key={feature.key} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {feature.label}
                      </td>
                      {validApps.map((app) => {
                        const value = feature.getValue(app);
                        return (
                          <td key={app.id} className="px-6 py-4 text-center">
                            {typeof value === 'boolean' ? (
                              value ? (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                                  {t('yes')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                  {t('no')}
                                </span>
                              )
                            ) : (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {value as string}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* App Details Cards */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {t('sections.details')}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {validApps.map((app) => (
                <div
                  key={app.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 text-2xl font-bold text-gray-500 dark:from-gray-700 dark:to-gray-600 dark:text-gray-400">
                    {app.name.charAt(0)}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <Link
                      href={`/${locale}/apps/${app.slug}`}
                      className="hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {app.name}
                    </Link>
                  </h3>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {app.description || t('noDescription')}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {app.isFree && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                        {commonT('free')}
                      </span>
                    )}
                    {app.isOpenSource && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {commonT('openSource')}
                      </span>
                    )}
                    {app.isAppStore && (
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                        {commonT('appStore')}
                      </span>
                    )}
                  </div>
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {t('visitWebsite')}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Related Apps in Same Category */}
          {validApps.length > 0 && validApps[0] && (
            <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                {t('sections.moreInCategory', { category: validApps[0].categoryName })}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{t('lookingForMore')}</p>
              <Link
                href={`/${locale}/category/${validApps[0].categoryName.toLowerCase().replace(/\s+/g, '-')}`}
                className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t('viewAllInCategory', { category: validApps[0].categoryName })}
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
        </main>
      </div>
    </>
  );
}
