'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { App } from '@/types';
import { trackSearch, trackAppDetailView } from '@/components/Analytics';

type SearchApp = Pick<
  App,
  'id' | 'slug' | 'name' | 'description' | 'categoryName' | 'isFree' | 'isOpenSource'
>;

interface SearchApiResponse {
  q: string;
  results: SearchApp[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  suggestions?: string[];
}

export function Search() {
  const locale = useLocale();
  const t = useTranslations('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchApp[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const q = query.trim();
      if (!q) {
        setResults([]);
        setSuggestions([]);
        setSelectedIndex(-1);
        setLoading(false);
        setHasTracked(false);
        return;
      }

      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(q)}&limit=10`, {
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Bad response'))))
        .then((data: SearchApiResponse) => {
          setResults(Array.isArray(data.results) ? data.results : []);
          setSuggestions(data.suggestions || []);
          setSelectedIndex(-1);

          // Track search query with results count
          if (!hasTracked && data.pagination) {
            trackSearch(q, data.pagination.total);
            setHasTracked(true);
          }
        })
        .catch((err) => {
          if (err?.name === 'AbortError') return;
          setResults([]);
          setSuggestions([]);
          setSelectedIndex(-1);
        })
        .finally(() => setLoading(false));
    }, 150);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, hasTracked]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            const selectedApp = results[selectedIndex];
            // Track app detail view before navigation
            trackAppDetailView(selectedApp.name, selectedApp.categoryName);
            window.location.href = `/${locale}/apps/${selectedApp.slug}`;
          }
          break;
        case 'Escape':
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, results, selectedIndex, locale]
  );

  // Global keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Handle app click tracking
  const handleAppClick = (app: SearchApp) => {
    trackAppDetailView(app.name, app.categoryName);
    setIsOpen(false);
    setQuery('');
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setHasTracked(false); // Allow tracking the new search
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
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
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHasTracked(false);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={`${t('placeholder')} (Cmd+K)`}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <kbd className="hidden rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 sm:inline-block dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
            Cmd+K
          </kbd>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.trim() && (
        <div
          ref={resultsRef}
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="p-4">
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {t('noResults', { query })}
              </p>
              {/* Show suggestions when no results */}
              {suggestions.length > 0 && (
                <div className="mt-3">
                  <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">
                    {t('tryDifferent')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {results.map((app, index) => (
                <li key={app.id}>
                  <Link
                    href={`/${locale}/apps/${app.slug}`}
                    onClick={() => handleAppClick(app)}
                    className={`flex items-start gap-3 p-3 transition-colors ${
                      index === selectedIndex
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {/* App Icon Placeholder */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 text-sm font-bold text-gray-500 dark:from-gray-700 dark:to-gray-600 dark:text-gray-400">
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {app.name}
                        </span>
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
                      <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                        {app.description}
                      </p>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {app.categoryName}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
