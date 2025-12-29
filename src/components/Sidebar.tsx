'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  categories: Category[];
}

export function Sidebar({ categories }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const sidebarRef = useRef<HTMLElement>(null);

  // Close sidebar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Auto-expand category if its subcategory is active
  useEffect(() => {
    if (!pathname) return;
    categories.forEach((category) => {
      if (category.subcategories?.some((sub) => pathname.includes(sub.slug))) {
        setExpandedCategories((prev) => new Set([...prev, category.id]));
      }
    });
  }, [pathname, categories]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const isActiveCategory = (category: Category): boolean => {
    return pathname === `/category/${category.slug}`;
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-20 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-lg transition-all hover:scale-105 active:scale-95 lg:hidden dark:bg-gray-800"
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <svg
          className="h-5 w-5 text-gray-600 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Overlay for mobile with backdrop blur */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-72 transform overflow-y-auto border-r border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-out lg:static lg:z-0 lg:translate-x-0 lg:border-r lg:shadow-none dark:border-gray-700 dark:bg-gray-900',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="p-4">
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Categories</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Close sidebar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <h2 className="hidden lg:block mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Categories
          </h2>

          <ul className="space-y-1">
            {categories.map((category) => (
              <li key={category.id}>
                {/* Main Category */}
                <div className="flex items-center">
                  <Link
                    href={`/category/${category.slug}`}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex-grow rounded-lg px-3 py-2.5 text-sm font-medium transition-all active:scale-95',
                      isActiveCategory(category)
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    )}
                  >
                    {category.name}
                  </Link>
                  {category.subcategories && category.subcategories.length > 0 && (
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="rounded-lg p-2 text-gray-500 transition-all hover:bg-gray-100 active:scale-95 dark:text-gray-400 dark:hover:bg-gray-800"
                      aria-label={`Toggle ${category.name} subcategories`}
                      aria-expanded={expandedCategories.has(category.id)}
                    >
                      <svg
                        className={cn(
                          'h-4 w-4 transition-transform duration-200',
                          expandedCategories.has(category.id) ? 'rotate-90' : ''
                        )}
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
                    </button>
                  )}
                </div>

                {/* Subcategories */}
                {category.subcategories &&
                  category.subcategories.length > 0 &&
                  expandedCategories.has(category.id) && (
                    <ul className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-2 dark:border-gray-700">
                      {category.subcategories.map((sub) => (
                        <li key={sub.id}>
                          <Link
                            href={`/category/${sub.slug}`}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              'block rounded-lg px-3 py-2 text-sm transition-all active:scale-95',
                              isActiveCategory(sub)
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                            )}
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
              </li>
            ))}
          </ul>

          {/* Sidebar Footer (mobile only) */}
          <div className="mt-8 border-t border-gray-200 pt-4 lg:hidden dark:border-gray-700">
            <a
              href="https://github.com/jaywcjlove/awesome-mac"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              View on GitHub
            </a>
          </div>
        </nav>
      </aside>
    </>
  );
}
