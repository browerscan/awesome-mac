import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getAllApps, getCategoryById, getCategories } from '@/lib/data';
import { AppCard } from '@/components/AppCard';
import { AppsCategorySelect } from '@/components/apps/CategorySelect';

export const revalidate = 3600;

const PAGE_SIZE = 48;

type FilterKey = 'all' | 'opensource' | 'free' | 'appstore';

interface AppsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    filter?: FilterKey;
    page?: string;
    category?: string;
  }>;
}

export async function generateMetadata({ searchParams }: AppsPageProps): Promise<Metadata> {
  const { filter, category, page } = await searchParams;
  const locale = 'en'; // Default for metadata

  const t = await getTranslations({ locale, namespace: 'apps' });

  const filterLabels: Record<FilterKey, string> = {
    all: t('filters.all'),
    opensource: t('filters.openSource'),
    free: t('filters.free'),
    appstore: t('filters.appStore'),
  };

  const filterTitle = filterLabels[filter || 'all'];
  const categoryObj = category ? await getCategoryById(category) : undefined;
  const categoryTitle = categoryObj ? ` ${t('inCategory', { category: categoryObj.name })}` : '';

  const pageNum = Math.max(1, Number(page || '1') || 1);
  const noIndex = Boolean((filter && filter !== 'all') || categoryObj || pageNum > 1);

  return {
    title: `${filterTitle} ${t('title')}${categoryTitle}`,
    description: `Browse the curated collection of macOS apps. Filter by free, open source, App Store, or by category.`,
    robots: {
      index: !noIndex,
      follow: true,
    },
  };
}

function buildHref(params: Record<string, string | undefined>, locale: string): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `/${locale}/apps?${qs}` : `/${locale}/apps`;
}

export default async function AppsPage({ params, searchParams }: AppsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'apps' });
  const { filter = 'all', page: pageRaw, category } = await searchParams;
  const page = Math.max(1, Number(pageRaw || '1') || 1);

  const [apps, categories] = await Promise.all([getAllApps(), getCategories()]);

  const categoryObj = category ? await getCategoryById(category) : undefined;
  const categoryId = categoryObj?.id;

  const filtered = apps
    .filter((app) => {
      if (filter === 'opensource' && !app.isOpenSource) return false;
      if (filter === 'free' && !app.isFree) return false;
      if (filter === 'appstore' && !app.isAppStore) return false;
      if (categoryId && app.categoryId !== categoryId && app.parentCategoryId !== categoryId) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageApps = filtered.slice(start, start + PAGE_SIZE);

  const filterLabels: Record<FilterKey, string> = {
    all: t('filters.all'),
    opensource: t('filters.openSource'),
    free: t('filters.free'),
    appstore: t('filters.appStore'),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('showing', {
              count: pageApps.length.toLocaleString(),
              total: total.toLocaleString(),
            })}
            {categoryObj ? ` ${t('inCategory', { category: categoryObj.name })}` : ''}.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          {(Object.keys(filterLabels) as FilterKey[]).map((key) => {
            const active = filter === key;
            return (
              <Link
                key={key}
                href={buildHref(
                  {
                    filter: key === 'all' ? undefined : key,
                    category,
                  },
                  locale
                )}
                className={`rounded-full px-4 py-2 text-sm font-medium ring-1 transition-colors ${
                  active
                    ? 'bg-blue-600 text-white ring-blue-600'
                    : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-700'
                }`}
              >
                {filterLabels[key]}
              </Link>
            );
          })}

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('filters.category')}:
            </span>
            <AppsCategorySelect
              categories={categories.map((c) => ({
                id: c.id,
                slug: c.slug,
                name: c.name,
              }))}
              selectedSlug={categoryObj?.slug}
              filter={filter}
              locale={locale}
            />
          </div>
        </div>

        {/* Apps grid */}
        {pageApps.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400">{t('noApps')}</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
            <Link
              href={buildHref(
                {
                  filter: filter === 'all' ? undefined : filter,
                  category,
                  page: currentPage > 1 ? String(currentPage - 1) : undefined,
                },
                locale
              )}
              aria-disabled={currentPage === 1}
              className={`rounded-lg px-3 py-2 text-sm ring-1 ${
                currentPage === 1
                  ? 'cursor-not-allowed bg-gray-100 text-gray-400 ring-gray-200 dark:bg-gray-800 dark:text-gray-600 dark:ring-gray-700'
                  : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-700'
              }`}
            >
              {t('pagination.prev')}
            </Link>
            <span className="px-2 text-sm text-gray-600 dark:text-gray-400">
              {t('pagination.page', {
                current: currentPage,
                total: totalPages,
              })}
            </span>
            <Link
              href={buildHref(
                {
                  filter: filter === 'all' ? undefined : filter,
                  category,
                  page: currentPage < totalPages ? String(currentPage + 1) : undefined,
                },
                locale
              )}
              aria-disabled={currentPage === totalPages}
              className={`rounded-lg px-3 py-2 text-sm ring-1 ${
                currentPage === totalPages
                  ? 'cursor-not-allowed bg-gray-100 text-gray-400 ring-gray-200 dark:bg-gray-800 dark:text-gray-600 dark:ring-gray-700'
                  : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-700'
              }`}
            >
              {t('pagination.next')}
            </Link>
          </nav>
        )}
      </main>
    </div>
  );
}
