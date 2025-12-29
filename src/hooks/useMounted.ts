import { useEffect, useState } from 'react';

/**
 * Custom hook to check if a component is mounted
 * Useful for avoiding state updates on unmounted components
 * @returns Boolean indicating if the component is mounted
 */
export function useMounted(): boolean {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  return isMounted;
}
