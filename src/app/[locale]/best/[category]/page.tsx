import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getCategories, getCategoryById, getAllApps } from '@/lib/data';
import { CategoryPageJsonLd, ItemListJsonLd } from '@/components/seo/JsonLd';
import { AppCard } from '@/components/AppCard';

interface BestCategoryPageProps {
  params: Promise<{
    locale: string;
    category: string;
  }>;
}

/**
 * Generate static params for all categories
 */
export async function generateStaticParams() {
  const categories = await getCategories();
  const params: { category: string }[] = [];

  for (const category of categories) {
    params.push({ category: category.slug });
    for (const sub of category.subcategories || []) {
      params.push({ category: sub.slug });
    }
  }

  return params;
}

/**
 * Generate metadata for the best category page
 */
export async function generateMetadata({ params }: BestCategoryPageProps): Promise<Metadata> {
  const { locale, category } = await params;
  const t = await getTranslations({ locale, namespace: 'best' });
  const categoryData = await getCategoryById(category);

  if (!categoryData) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.',
    };
  }

  const categoryName = categoryData.name;
  const title = t('meta.title', { category: categoryName });
  const description = t('meta.description', { category: categoryName.toLowerCase() });

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
 * Best Apps by Category page component
 */
export default async function BestCategoryPage({ params }: BestCategoryPageProps) {
  const { locale, category } = await params;
  const t = await getTranslations({ locale, namespace: 'best' });
  const commonT = await getTranslations({ locale, namespace: 'common' });

  const categoryData = await getCategoryById(category);
  const allApps = await getAllApps();

  if (!categoryData) {
    notFound();
  }

  // Get apps for this category (including subcategories)
  const categoryApps = allApps.filter(
    (app) =>
      app.categoryId === categoryData.id ||
      app.parentCategoryId === categoryData.id ||
      categoryData.subcategories?.some((sub) => sub.id === app.categoryId)
  );

  // Sort apps: prioritize free and open source apps
  const sortedApps = [...categoryApps].sort((a, b) => {
    const scoreA = (a.isFree ? 2 : 0) + (a.isOpenSource ? 1 : 0);
    const scoreB = (b.isFree ? 2 : 0) + (b.isOpenSource ? 1 : 0);
    return scoreB - scoreA;
  });

  const parentCategory = categoryData.parentId
    ? await getCategoryById(categoryData.parentId)
    : undefined;

  const breadcrumbs = [
    { name: commonT('home'), href: `/${locale}` },
    { name: t('breadcrumb'), href: `/${locale}/best` },
    ...(parentCategory
      ? [
          {
            name: parentCategory.name,
            href: `/${locale}/best/${parentCategory.slug}`,
          },
        ]
      : []),
    { name: categoryData.name, href: `/${locale}/best/${categoryData.slug}` },
  ];

  return (
    <>
      {/* Structured Data */}
      <CategoryPageJsonLd category={categoryData} breadcrumbs={breadcrumbs} />
      <ItemListJsonLd items={sortedApps} />

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
          <div className="mb-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-700 p-8 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center rounded-full bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur-sm">
                {t('badge')}
              </span>
              <h1 className="text-3xl font-bold">{t('title', { category: categoryData.name })}</h1>
            </div>

            <p className="text-lg text-blue-50 mb-4">{t('hero.description')}</p>

            {categoryData.description && (
              <p className="text-blue-100 text-sm">{categoryData.description}</p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/category/${categoryData.slug}`}
                className="inline-flex items-center rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30 backdrop-blur-sm"
              >
                {t('links.viewAll', { category: categoryData.name })}
              </Link>
              <Link
                href={`/${locale}/free`}
                className="inline-flex items-center rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 backdrop-blur-sm"
              >
                {t('links.freeAlternatives')}
              </Link>
            </div>
          </div>

          {/* Top Picks Section */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {t('topPicks')}
            </h2>

            {sortedApps.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sortedApps.map((app, index) => (
                  <div key={app.id} className="relative">
                    {index < 3 && (
                      <div className="absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-xs font-bold text-white shadow-lg">
                        {index + 1}
                      </div>
                    )}
                    <AppCard app={app} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">{t('noApps')}</p>
                <Link
                  href={`/${locale}/categories`}
                  className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400"
                >
                  {commonT('browseAll')}
                </Link>
              </div>
            )}
          </div>

          {/* Subcategories */}
          {categoryData.subcategories && categoryData.subcategories.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('subcategories', { category: categoryData.name })}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categoryData.subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/${locale}/best/${sub.slug}`}
                    className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{sub.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {sub.apps.length} {commonT('apps', { count: sub.apps.length })}
                        </p>
                      </div>
                      <svg
                        className="h-5 w-5 text-gray-400"
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
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* SEO Content Section */}
          <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              {t('content.guideTitle', { category: categoryData.name })}
            </h2>
            <div className="prose prose-gray max-w-none dark:prose-invert">
              <p>{t('content.intro', { category: categoryData.name.toLowerCase() })}</p>

              <h3 className="text-lg font-semibold mt-6 mb-3">
                {t('content.whatToLookFor.title')}
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('content.whatToLookFor.nativeExperience')}</li>
                <li>{t('content.whatToLookFor.regularUpdates')}</li>
                <li>{t('content.whatToLookFor.userReviews')}</li>
                <li>{t('content.whatToLookFor.freeTrials')}</li>
                <li>{t('content.whatToLookFor.privacy')}</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">{t('content.freeVsPaid.title')}</h3>
              <p>
                {t('content.freeVsPaid.description', { category: categoryData.name.toLowerCase() })}
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
