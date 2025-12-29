'use client';

import { useState, useEffect } from 'react';

const FAVORITES_KEY = 'awesome-mac-favorites';

/**
 * Custom hook for managing favorite apps using localStorage
 * Provides full client-side favorite management without requiring a database
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const favArray = JSON.parse(stored);
        setFavorites(new Set(favArray));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        const favArray = Array.from(favorites);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favArray));
      } catch (error) {
        console.error('Failed to save favorites:', error);
      }
    }
  }, [favorites, isLoaded]);

  /**
   * Check if an app is in favorites
   */
  const isFavorite = (appSlug: string): boolean => {
    return favorites.has(appSlug);
  };

  /**
   * Toggle an app's favorite status
   */
  const toggleFavorite = (appSlug: string): void => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(appSlug)) {
        newSet.delete(appSlug);
      } else {
        newSet.add(appSlug);
      }
      return newSet;
    });
  };

  /**
   * Add an app to favorites
   */
  const addFavorite = (appSlug: string): void => {
    setFavorites((prev) => new Set(prev).add(appSlug));
  };

  /**
   * Remove an app from favorites
   */
  const removeFavorite = (appSlug: string): void => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      newSet.delete(appSlug);
      return newSet;
    });
  };

  /**
   * Get count of favorite apps
   */
  const count = favorites.size;

  /**
   * Clear all favorites
   */
  const clearFavorites = (): void => {
    setFavorites(new Set());
  };

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    count,
    isLoaded,
  };
}
