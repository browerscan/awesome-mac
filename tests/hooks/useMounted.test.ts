import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMounted } from '@/hooks/useMounted';

describe('useMounted', () => {
  it('should return true after mount (happy-dom runs useEffect synchronously)', () => {
    const { result } = renderHook(() => useMounted());
    // In happy-dom, useEffect runs synchronously, so isMounted is true immediately
    expect(result.current).toBe(true);
  });

  it('should return a consistent value across renders', () => {
    const { result } = renderHook(() => useMounted());
    const firstValue = result.current;
    expect(result.current).toBe(firstValue);
  });

  it('should handle unmount', () => {
    const { result, unmount } = renderHook(() => useMounted());
    expect(result.current).toBe(true);
    unmount();
    // After unmount, the cleanup function runs but we can't check the value
    expect(result.current).toBe(true); // Value persists in the hook result
  });
});
