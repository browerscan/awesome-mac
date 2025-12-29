import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearchQuery } from '@/hooks/useSearchQuery';

describe('useSearchQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with empty query', () => {
    const { result } = renderHook(() => useSearchQuery());
    expect(result.current.query).toBe('');
    expect(result.current.debouncedQuery).toBe('');
    expect(result.current.isSearching).toBe(false);
  });

  it('should update query immediately', () => {
    const { result } = renderHook(() => useSearchQuery());
    act(() => {
      result.current.setQuery('test');
    });
    expect(result.current.query).toBe('test');
  });

  it('should debounce the query', () => {
    const { result } = renderHook(() => useSearchQuery());
    act(() => {
      result.current.setQuery('test');
    });
    expect(result.current.debouncedQuery).toBe('');
    expect(result.current.isSearching).toBe(true);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.debouncedQuery).toBe('test');
    expect(result.current.isSearching).toBe(false);
  });

  it('should trim whitespace from query', () => {
    const { result } = renderHook(() => useSearchQuery());
    act(() => {
      result.current.setQuery('  test  ');
    });
    expect(result.current.query).toBe('test');
  });

  it('should clear query', () => {
    const { result } = renderHook(() => useSearchQuery());
    act(() => {
      result.current.setQuery('test');
    });
    expect(result.current.query).toBe('test');

    act(() => {
      result.current.clearQuery();
    });
    expect(result.current.query).toBe('');
  });

  it('should determine isSearching based on minLength', () => {
    const { result } = renderHook(() => useSearchQuery({ minLength: 3 }));
    act(() => {
      result.current.setQuery('te');
    });
    expect(result.current.isSearching).toBe(false);

    act(() => {
      result.current.setQuery('test');
    });
    expect(result.current.isSearching).toBe(true);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.isSearching).toBe(false);
  });

  it('should use custom debounce delay', () => {
    const { result } = renderHook(() => useSearchQuery({ debounceMs: 500 }));
    act(() => {
      result.current.setQuery('test');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.debouncedQuery).toBe('');

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.debouncedQuery).toBe('test');
  });
});
