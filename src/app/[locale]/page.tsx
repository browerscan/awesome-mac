import { getTranslations } from 'next-intl/server';
import { getCategories, getAllApps } from '@/lib/data';
import { Search } from '@/components/Search';
import { CategoryCard } from '@/components/CategoryCard';
import { AppCard } from '@/components/AppCard';
import { HomePageJsonLd } from '@/components/seo/JsonLd';
import { RecentlyAdded } from '@/components/RecentlyAdded';
import { TrendingApps } from '@/components/TrendingApps';

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    title: typeof t('hero.title') === 'string' ? t('hero.title') : 'Awesome Mac',
    description: t('hero.description'),
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const commonT = await getTranslations({ locale, namespace: 'common' });

  const [categories, apps] = await Promise.all([getCategories(), getAllApps()]);

  // Get featured apps (open source and free)
  const featuredApps = apps.filter((app) => app.isOpenSource && app.isFree).slice(0, 8);

  // Get recently added apps (take from end of array for "newest")
  const recentlyAdded = [...apps].reverse().slice(0, 6);

  // Get trending apps (prioritize open source and free apps)
  const trendingApps = apps.filter((app) => app.isOpenSource || app.isFree).slice(0, 6);

  // Calculate stats
  const totalApps = apps.length;
  const openSourceApps = apps.filter((app) => app.isOpenSource).length;
  const freeApps = apps.filter((app) => app.isFree).length;

  return (
    <>
      <HomePageJsonLd />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white px-4 py-16 dark:border-gray-800 dark:from-gray-900 dark:to-gray-900 sm:px-6 lg:px-8">
          <div className="bg-dots pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative mx-auto max-w-7xl">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                {t('hero.beforeGradient')}{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t('hero.gradient')}
                </span>
                {t('hero.afterGradient')}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                {t('hero.description')}
              </p>

              {/* Search Bar */}
              <div className="mx-auto mt-8 max-w-xl">
                <Search />
              </div>

              {/* Stats */}
              <div className="mt-10 flex flex-wrap justify-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {totalApps.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('stats.totalApps')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {openSourceApps.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('stats.openSource')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {freeApps.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('stats.freeApps')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {categories.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('stats.categories')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trending Apps Section */}
        <TrendingApps apps={trendingApps} maxItems={6} />

        {/* Recently Added Section */}
        <RecentlyAdded apps={recentlyAdded} maxItems={6} />

        {/* Categories Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('browseByCategory.title')}
              </h2>
              <a
                href={`/${locale}/categories`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t('browseByCategory.viewAll')}
              </a>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.slice(0, 12).map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>

            {categories.length > 12 && (
              <div className="mt-8 text-center">
                <a
                  href={`/${locale}/categories`}
                  className="btn btn-secondary inline-flex items-center gap-2"
                >
                  {t('browseByCategory.viewAllCount', {
                    count: categories.length,
                  })}
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Featured Apps Section */}
        <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 dark:border-gray-800 dark:bg-gray-800/50 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('featured.title')}
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {t('featured.subtitle')}
                </p>
              </div>
              <a
                href={`/${locale}/apps?filter=opensource`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {t('featured.viewAll')}
              </a>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('contribute.title')}
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">{t('contribute.description')}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/jaywcjlove/awesome-mac"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                {commonT('viewOnGitHub')}
              </a>
              <a
                href="https://github.com/jaywcjlove/awesome-mac/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                {commonT('suggestAnApp')}
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
