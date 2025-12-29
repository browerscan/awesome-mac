import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getCategories } from '@/lib/data';
import { CategoryCard } from '@/components/CategoryCard';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'categories' });

  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'categories' });
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">{t('subtitle')}</p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </main>
    </div>
  );
}
