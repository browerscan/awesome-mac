'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { App } from '@/types';
import {
  SearchResult,
  createSearchIndex,
  SearchIndex,
  FilterCriteria,
  filterApps,
} from '@/lib/search';

const RECENT_SEARCHES_KEY = 'awesome-mac-recent-searches';
const MAX_RECENT_SEARCHES = 10;

export interface SearchFilters {
  isFree: boolean;
  isOpenSource: boolean;
  isAppStore: boolean;
}

interface SearchContextValue {
  // Query state
  query: string;
  setQuery: (query: string) => void;

  // Results
  results: SearchResult[];
  isSearching: boolean;

  // Filters
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  toggleFilter: (filter: keyof SearchFilters) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;

  // Recent searches
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Filtered apps (without search query)
  filteredApps: App[];

  // All apps
  allApps: App[];
}

const SearchContext = createContext<SearchContextValue | null>(null);

interface SearchProviderProps {
  children: ReactNode;
  apps: App[];
}

export function SearchProvider({ children, apps }: SearchProviderProps) {
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFiltersState] = useState<SearchFilters>({
    isFree: false,
    isOpenSource: false,
    isAppStore: false,
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchIndex, setSearchIndex] = useState<SearchIndex | null>(null);

  // Initialize search index
  useEffect(() => {
    const index = createSearchIndex(apps);
    setSearchIndex(index);
  }, [apps]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearches = useCallback((searches: string[]) => {
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Calculate filtered apps based on current filters
  const filteredApps = useMemo(() => {
    const criteria: FilterCriteria = {};
    if (filters.isFree) criteria.isFree = true;
    if (filters.isOpenSource) criteria.isOpenSource = true;
    if (filters.isAppStore) criteria.isAppStore = true;

    return filterApps(apps, criteria);
  }, [apps, filters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.isFree || filters.isOpenSource || filters.isAppStore;
  }, [filters]);

  // Perform search with debouncing
  useEffect(() => {
    if (!searchIndex) return;

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(() => {
      // Search within filtered apps if filters are active
      const appsToSearch = hasActiveFilters ? filteredApps : apps;
      const tempIndex = createSearchIndex(appsToSearch);
      const searchResults = tempIndex.search(trimmedQuery, 50);

      setResults(searchResults);
      setIsSearching(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, searchIndex, filteredApps, hasActiveFilters, apps]);

  // Set query and handle trimming
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
  }, []);

  // Set filters
  const setFilters = useCallback((newFilters: SearchFilters) => {
    setFiltersState(newFilters);
  }, []);

  // Toggle individual filter
  const toggleFilter = useCallback((filter: keyof SearchFilters) => {
    setFiltersState((prev) => ({
      ...prev,
      [filter]: !prev[filter],
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFiltersState({
      isFree: false,
      isOpenSource: false,
      isAppStore: false,
    });
  }, []);

  // Add a search to recent searches
  const addRecentSearch = useCallback(
    (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed || trimmed.length < 2) return;

      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
        const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        saveRecentSearches(updated);
        return updated;
      });
    },
    [saveRecentSearches]
  );

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const value: SearchContextValue = {
    query,
    setQuery,
    results,
    isSearching,
    filters,
    setFilters,
    toggleFilter,
    clearFilters,
    hasActiveFilters,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    filteredApps,
    allApps: apps,
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
