'use client';

import { useEffect } from 'react';
import { trackCategoryView } from '@/components/Analytics';

interface CategoryTrackerProps {
  categoryName: string;
}

export function CategoryTracker({ categoryName }: CategoryTrackerProps) {
  useEffect(() => {
    // Track category view on mount
    trackCategoryView(categoryName);
  }, [categoryName]);

  return null;
}
