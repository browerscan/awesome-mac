'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const locale = useLocale();

  const appCount =
    category.apps.length +
    (category.subcategories?.reduce((sum, sub) => sum + sub.apps.length, 0) || 0);

  const subcategoryCount = category.subcategories?.length || 0;

  return (
    <Link
      href={`/${locale}/category/${category.slug}`}
      className="group relative flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
    >
      {/* Category Icon */}
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white">
        {category.name.charAt(0).toUpperCase()}
      </div>

      {/* Category Name */}
      <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
        {category.name}
      </h3>

      {/* Description */}
      {category.description && (
        <p className="mb-4 flex-grow text-sm text-gray-600 line-clamp-2 dark:text-gray-400">
          {category.description}
        </p>
      )}

      {/* Stats */}
      <div className="mt-auto flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          {appCount} {appCount === 1 ? 'app' : 'apps'}
        </span>
        {subcategoryCount > 0 && (
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            {subcategoryCount} {subcategoryCount === 1 ? 'subcategory' : 'subcategories'}
          </span>
        )}
      </div>

      {/* Arrow icon */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <svg
          className="h-5 w-5 text-blue-600 dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
