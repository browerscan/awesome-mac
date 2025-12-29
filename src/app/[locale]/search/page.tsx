import { Metadata } from 'next';
import { Suspense } from 'react';
import { generateSearchMetadata } from '@/lib/seo';
import { searchApps } from '@/lib/data';
import { AppCard } from '@/components/AppCard';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

/**
 * Generate metadata for search page
 */
export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return generateSearchMetadata(q);
}

/**
 * Search results component
 */
async function SearchResults({ query }: { query: string }) {
  const results = await searchApps(query);

  if (results.length === 0) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h2 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No results found</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          No apps found matching &quot;{query}&quot;. Try a different search term.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Found {results.length} app{results.length !== 1 ? 's' : ''} matching &quot;{query}&quot;
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {results.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}

/**
 * Search input component
 */
function SearchInput({ defaultValue = '' }: { defaultValue?: string }) {
  return (
    <form action="/search" method="GET" className="mb-8">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="Search for Mac apps..."
          className="block w-full rounded-lg border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          autoComplete="off"
          autoFocus
        />
        <button
          type="submit"
          className="absolute inset-y-0 right-0 flex items-center rounded-r-lg bg-blue-600 px-6 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Search
        </button>
      </div>
    </form>
  );
}

/**
 * Loading skeleton for search results
 */
function SearchResultsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-4 h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="mb-2 h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mb-4 space-y-2">
            <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Search page component
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: query } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">Search Mac Apps</h1>

        <SearchInput defaultValue={query} />

        {query ? (
          <Suspense fallback={<SearchResultsSkeleton />}>
            <SearchResults query={query} />
          </Suspense>
        ) : (
          <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h2 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Search our collection
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Enter a search term above to find Mac applications.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
