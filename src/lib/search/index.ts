import { App } from '@/types';

export interface SearchResult {
  app: App;
  score: number;
  matches: string[];
}

export interface SearchIndex {
  search: (query: string, limit?: number) => SearchResult[];
  add: (app: App) => void;
  remove: (id: string) => void;
  clear: () => void;
}

interface IndexedApp {
  app: App;
  nameLower: string;
  descLower: string;
  categoryLower: string;
  tokens: string[];
}

/**
 * Create a search index for apps
 * Uses an optimized in-memory approach with tokenization and scoring
 */
export function createSearchIndex(apps: App[]): SearchIndex {
  const indexedApps: Map<string, IndexedApp> = new Map();

  // Tokenize text into searchable tokens
  function tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 1);
  }

  // Index a single app
  function indexApp(app: App): IndexedApp {
    const nameLower = app.name.toLowerCase();
    const descLower = app.description.toLowerCase();
    const categoryLower = app.categoryName.toLowerCase();

    const tokens = [
      ...tokenize(app.name),
      ...tokenize(app.description),
      ...tokenize(app.categoryName),
    ];

    return { app, nameLower, descLower, categoryLower, tokens };
  }

  // Build initial index
  for (const app of apps) {
    indexedApps.set(app.id, indexApp(app));
  }

  /**
   * Calculate match score for a query against an indexed app
   */
  function calculateScore(
    indexed: IndexedApp,
    query: string,
    queryTokens: string[]
  ): { score: number; matches: string[] } {
    let score = 0;
    const matches: string[] = [];
    const queryLower = query.toLowerCase();

    // Exact name match - highest priority
    if (indexed.nameLower === queryLower) {
      score += 100;
      matches.push('name:exact');
    }
    // Name starts with query
    else if (indexed.nameLower.startsWith(queryLower)) {
      score += 75;
      matches.push('name:prefix');
    }
    // Name contains query
    else if (indexed.nameLower.includes(queryLower)) {
      score += 50;
      matches.push('name:contains');
    }

    // Description contains full query
    if (indexed.descLower.includes(queryLower)) {
      score += 20;
      matches.push('description:contains');
    }

    // Category match
    if (indexed.categoryLower.includes(queryLower)) {
      score += 15;
      matches.push('category:contains');
    }

    // Token-based matching for multi-word queries
    let tokenMatchCount = 0;
    for (const queryToken of queryTokens) {
      // Check name tokens
      if (indexed.tokens.some((t) => t.startsWith(queryToken))) {
        tokenMatchCount++;
        if (!matches.includes('tokens:name')) {
          matches.push('tokens:name');
        }
      }
    }

    // Bonus for matching multiple tokens
    if (tokenMatchCount > 0) {
      score += tokenMatchCount * 10;
    }

    // Bonus for exact token matches
    for (const queryToken of queryTokens) {
      if (indexed.tokens.includes(queryToken)) {
        score += 5;
      }
    }

    return { score, matches };
  }

  return {
    search(query: string, limit: number = 20): SearchResult[] {
      if (!query.trim()) return [];

      const queryLower = query.toLowerCase().trim();
      const queryTokens = tokenize(query);

      const results: SearchResult[] = [];

      for (const indexed of indexedApps.values()) {
        const { score, matches } = calculateScore(indexed, queryLower, queryTokens);

        if (score > 0) {
          results.push({
            app: indexed.app,
            score,
            matches,
          });
        }
      }

      // Sort by score descending, then by name ascending
      results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.app.name.localeCompare(b.app.name);
      });

      return results.slice(0, limit);
    },

    add(app: App): void {
      indexedApps.set(app.id, indexApp(app));
    },

    remove(id: string): void {
      indexedApps.delete(id);
    },

    clear(): void {
      indexedApps.clear();
    },
  };
}

/**
 * Simple search function for server-side use without maintaining an index
 */
export function searchApps(apps: App[], query: string, limit: number = 20): SearchResult[] {
  const index = createSearchIndex(apps);
  return index.search(query, limit);
}

/**
 * Filter apps based on filter criteria
 */
export interface FilterCriteria {
  isFree?: boolean;
  isOpenSource?: boolean;
  isAppStore?: boolean;
  categoryId?: string;
}

export function filterApps(apps: App[], filters: FilterCriteria): App[] {
  return apps.filter((app) => {
    if (filters.isFree && !app.isFree) return false;
    if (filters.isOpenSource && !app.isOpenSource) return false;
    if (filters.isAppStore && !app.isAppStore) return false;
    if (
      filters.categoryId &&
      app.categoryId !== filters.categoryId &&
      app.parentCategoryId !== filters.categoryId
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Combined search and filter
 */
export function searchAndFilterApps(
  apps: App[],
  query: string,
  filters: FilterCriteria,
  limit: number = 20
): SearchResult[] {
  // First apply filters
  const filteredApps = filterApps(apps, filters);

  // Then search within filtered results
  if (!query.trim()) {
    // No query, return filtered apps sorted by name
    return filteredApps.slice(0, limit).map((app) => ({
      app,
      score: 0,
      matches: [],
    }));
  }

  return searchApps(filteredApps, query, limit);
}

/**
 * Highlight matching text in a string
 */
export function highlightMatches(
  text: string,
  query: string
): { text: string; highlighted: boolean }[] {
  if (!query.trim()) {
    return [{ text, highlighted: false }];
  }

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const parts: { text: string; highlighted: boolean }[] = [];
  let lastIndex = 0;

  let index = textLower.indexOf(queryLower);
  while (index !== -1) {
    // Add non-matching part
    if (index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, index),
        highlighted: false,
      });
    }

    // Add matching part
    parts.push({
      text: text.slice(index, index + query.length),
      highlighted: true,
    });

    lastIndex = index + query.length;
    index = textLower.indexOf(queryLower, lastIndex);
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      highlighted: false,
    });
  }

  return parts.length > 0 ? parts : [{ text, highlighted: false }];
}
