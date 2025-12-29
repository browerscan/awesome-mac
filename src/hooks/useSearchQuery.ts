import { useState, useCallback } from 'react';
import { useDebounce } from './useDebounce';

export interface SearchQueryOptions {
  debounceMs?: number;
  minLength?: number;
}

export interface UseSearchQueryReturn {
  query: string;
  debouncedQuery: string;
  setQuery: (query: string) => void;
  isSearching: boolean;
  clearQuery: () => void;
}

/**
 * Custom hook for managing search query state with debouncing
 * @param options - Configuration options for debouncing and minimum query length
 * @returns Search query state and handlers
 */
export function useSearchQuery(options: SearchQueryOptions = {}): UseSearchQueryReturn {
  const { debounceMs = 300, minLength = 2 } = options;

  const [query, setQueryState] = useState('');
  const debouncedQuery = useDebounce(query, debounceMs);
  const isSearching = query.length >= minLength && query !== debouncedQuery;

  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery.trim());
  }, []);

  const clearQuery = useCallback(() => {
    setQueryState('');
  }, []);

  return {
    query,
    debouncedQuery,
    setQuery,
    isSearching,
    clearQuery,
  };
}
