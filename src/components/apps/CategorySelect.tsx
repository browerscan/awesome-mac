'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useTransition } from 'react';
import { trackFilter } from '@/components/Analytics';

export interface CategorySelectItem {
  id: string;
  slug: string;
  name: string;
}

export function AppsCategorySelect({
  categories,
  selectedSlug,
  filter,
  locale = 'en',
}: {
  categories: CategorySelectItem[];
  selectedSlug?: string;
  filter?: string;
  locale?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const options = useMemo(() => {
    return [{ id: '', slug: '', name: 'All categories' }, ...categories];
  }, [categories]);

  return (
    <select
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      value={selectedSlug || ''}
      disabled={pending}
      onChange={(e) => {
        const slug = e.target.value || '';
        const selectedCategory = options.find((c) => c.slug === slug);

        // Track filter usage
        if (slug) {
          trackFilter('category', selectedCategory?.name || slug);
        } else {
          trackFilter('category', 'all');
        }

        const sp = new URLSearchParams();
        if (filter && filter !== 'all') sp.set('filter', filter);
        if (slug) sp.set('category', slug);

        const href = sp.toString() ? `/${locale}/apps?${sp.toString()}` : `/${locale}/apps`;
        startTransition(() => router.push(href));
      }}
    >
      {options.map((c) => (
        <option key={c.id || 'all'} value={c.slug}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
