import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getCategoryById, getCategories, getAllApps } from '@/lib/data';
import { CategoryPageJsonLd } from '@/components/seo/JsonLd';
import { AppCard } from '@/components/AppCard';
import { CategoryTracker } from '@/components/CategoryTracker';

interface CategoryPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

/**
 * Generate static params for all categories
 */
export async function generateStaticParams() {
  const categories = await getCategories();
  const params: { slug: string }[] = [];

  for (const category of categories) {
    params.push({ slug: category.slug });
    for (const sub of category.subcategories || []) {
      params.push({ slug: sub.slug });
    }
  }

  return params;
}

/**
 * Generate metadata for the category page with enhanced SEO
 */
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  void (await getTranslations({ locale, namespace: 'category' })); // Load for future use
  const category = await getCategoryById(slug);

  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.',
    };
  }

  const appCount = category.apps.length;
  const subcategoryCount = category.subcategories?.length || 0;

  // SEO-optimized title
  const title = `Best ${category.name} Apps for Mac - Top ${appCount} ${category.name} Software`;

  // SEO-optimized description
  let description = category.description;
  if (!description) {
    description = `Discover the best ${category.name.toLowerCase()} apps for Mac. `;
    description += `Our curated list features ${appCount} top-rated ${category.name.toLowerCase()} software recommendations. `;
    if (subcategoryCount > 0) {
      description += `Browse ${subcategoryCount} subcategories including `;
      description += category
        .subcategories!.slice(0, 3)
        .map((s) => s.name)
        .join(', ');
      if (subcategoryCount > 3) description += ', and more';
      description += '.';
    }
  }

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
 * Category page component
 */
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'category' });
  const commonT = await getTranslations({ locale, namespace: 'common' });
  const category = await getCategoryById(slug);

  if (!category) {
    notFound();
  }

  const parentCategory = category.parentId ? await getCategoryById(category.parentId) : undefined;

  // Get category apps for internal linking sections
  const categoryApps = category.apps;
  const freeApps = categoryApps.filter((app) => app.isFree);
  const ossApps = categoryApps.filter((app) => app.isOpenSource);
  const popularApps = [...categoryApps]
    .sort((a, b) => {
      const scoreA = (a.isFree ? 2 : 0) + (a.isOpenSource ? 1 : 0);
      const scoreB = (b.isFree ? 2 : 0) + (b.isOpenSource ? 1 : 0);
      return scoreB - scoreA;
    })
    .slice(0, 6);

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
    { name: category.name, href: `/${locale}/category/${category.slug}` },
  ];

  return (
    <>
      {/* Analytics Tracker */}
      <CategoryTracker categoryName={category.name} />

      {/* Structured Data */}
      <CategoryPageJsonLd category={category} breadcrumbs={breadcrumbs} />

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

        {/* Category Header */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-lg text-gray-600 dark:text-gray-400">{category.description}</p>
            )}
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              {t('appsInCategory', { count: category.apps.length })}
            </p>
          </div>

          {/* Subcategories */}
          {category.subcategories && category.subcategories.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                {t('subcategories')}
              </h2>
              <div className="flex flex-wrap gap-2">
                {category.subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/${locale}/category/${sub.slug}`}
                    className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-700"
                  >
                    {sub.name}
                    <span className="ml-2 text-gray-400">({sub.apps.length})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Apps Grid */}
          {category.apps.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {category.apps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">{t('noApps')}</p>
              <Link
                href={`/${locale}/categories`}
                className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400"
              >
                {t('browseAll')}
              </Link>
            </div>
          )}

          {/* Internal Linking Section: Free Apps in Category */}
          {freeApps.length > 0 && (
            <div className="mt-12">
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Free {category.name} Apps
                </h2>
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                  {freeApps.length} Free
                </span>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {freeApps.slice(0, 4).map((app) => (
                  <AppCard key={app.id} app={app} />
                ))}
              </div>
              {freeApps.length > 4 && (
                <Link
                  href={`/${locale}/free`}
                  className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View all free apps
                  <svg
                    className="ml-1 h-4 w-4"
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
                </Link>
              )}
            </div>
          )}

          {/* Internal Linking Section: Open Source Apps in Category */}
          {ossApps.length > 0 && (
            <div className="mt-12">
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Open Source {category.name} Apps
                </h2>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  {ossApps.length} Open Source
                </span>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {ossApps.slice(0, 4).map((app) => (
                  <AppCard key={app.id} app={app} />
                ))}
              </div>
              {ossApps.length > 4 && (
                <Link
                  href={`/${locale}/open-source`}
                  className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View all open source apps
                  <svg
                    className="ml-1 h-4 w-4"
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
                </Link>
              )}
            </div>
          )}

          {/* Internal Linking Section: Popular in Category */}
          {popularApps.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                Popular {category.name} Apps
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {popularApps.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                  >
                    <Link href={`/${locale}/apps/${app.slug}`} className="block text-center">
                      <div className="mb-3 flex h-12 w-12 mx-auto items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 text-xl font-bold text-gray-500 dark:from-gray-700 dark:to-gray-600 dark:text-gray-400">
                        {app.name.charAt(0)}
                      </div>
                      <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {app.name}
                      </h3>
                      <div className="flex flex-wrap justify-center gap-1">
                        {app.isFree && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                            Free
                          </span>
                        )}
                        {app.isOpenSource && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            OSS
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEO Content Section */}
          <div className="mt-12 rounded-lg bg-white p-8 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              About {category.name} Apps for Mac
            </h2>
            <div className="prose prose-gray max-w-none dark:prose-invert">
              <p>
                {category.description ||
                  `Discover the best ${category.name.toLowerCase()} applications for macOS. Our curated collection includes both free and premium options to suit every need and budget.`}
              </p>

              {freeApps.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mt-6 mb-3">Free {category.name} Software</h3>
                  <p>
                    Explore {freeApps.length} free {category.name.toLowerCase()} apps that offer
                    powerful features without any cost. Many of these are open-source projects
                    maintained by passionate communities.
                  </p>
                </>
              )}

              {ossApps.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mt-6 mb-3">
                    Open Source {category.name} Tools
                  </h3>
                  <p>
                    Discover {ossApps.length} open-source {category.name.toLowerCase()} applications
                    with transparent code that you can audit, modify, and contribute to.
                  </p>
                </>
              )}

              <h3 className="text-lg font-semibold mt-6 mb-3">Choosing the Right App</h3>
              <p>
                When selecting {category.name.toLowerCase()} software for your Mac, consider factors
                such as feature set, ease of use, integration with other apps, and pricing. Our
                curated list above includes options for both beginners and advanced users.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-6 dark:from-gray-800 dark:to-gray-700">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Explore More
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/${locale}/free`}
                className="inline-flex items-center rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
              >
                All Free Apps
              </Link>
              <Link
                href={`/${locale}/open-source`}
                className="inline-flex items-center rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
              >
                All Open Source Apps
              </Link>
              <Link
                href={`/${locale}/categories`}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                All Categories
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
