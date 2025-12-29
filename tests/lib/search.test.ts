import { describe, it, expect } from 'vitest';
import {
  createSearchIndex,
  searchApps,
  filterApps,
  searchAndFilterApps,
  highlightMatches,
} from '@/lib/search';
import type { App } from '@/types';

const mockApps: App[] = [
  {
    id: '1',
    slug: 'vscode',
    name: 'VS Code',
    description: 'A powerful text editor for developers',
    url: 'https://code.visualstudio.com',
    isFree: true,
    isOpenSource: true,
    isAppStore: false,
    hasAwesomeList: false,
    ossUrl: 'https://github.com/microsoft/vscode',
    categoryId: 'dev-tools',
    categoryName: 'Development Tools',
  },
  {
    id: '2',
    slug: 'sublime',
    name: 'Sublime Text',
    description: 'A sophisticated text editor for code, markup and prose',
    url: 'https://www.sublimetext.com',
    isFree: false,
    isOpenSource: false,
    isAppStore: true,
    hasAwesomeList: false,
    appStoreUrl: 'https://apps.apple.com/app/sublime-text',
    categoryId: 'dev-tools',
    categoryName: 'Development Tools',
  },
  {
    id: '3',
    slug: 'iterm2',
    name: 'iTerm2',
    description: 'Terminal emulator for macOS',
    url: 'https://iterm2.com',
    isFree: true,
    isOpenSource: true,
    isAppStore: false,
    hasAwesomeList: false,
    ossUrl: 'https://github.com/gnachman/iTerm2',
    categoryId: 'terminal',
    categoryName: 'Terminal',
  },
  {
    id: '4',
    slug: 'fig',
    name: 'Fig',
    description: 'Terminal autocomplete tool',
    url: 'https://fig.io',
    isFree: true,
    isOpenSource: false,
    isAppStore: false,
    hasAwesomeList: true,
    awesomeListUrl: 'https://github.com/withfig/autocomplete',
    categoryId: 'terminal',
    categoryName: 'Terminal',
  },
];

describe('createSearchIndex', () => {
  it('should create a search index from apps', () => {
    const index = createSearchIndex(mockApps);
    expect(index).toBeDefined();
    expect(typeof index.search).toBe('function');
    expect(typeof index.add).toBe('function');
    expect(typeof index.remove).toBe('function');
    expect(typeof index.clear).toBe('function');
  });

  it('should find exact name matches', () => {
    const index = createSearchIndex(mockApps);
    const results = index.search('VS Code');
    // VS Code is the exact match, vscode also matches via tokens
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]?.app.name).toBe('VS Code');
    expect(results[0]?.score).toBeGreaterThanOrEqual(100);
    expect(results[0]?.matches).toContain('name:exact');
  });

  it('should find prefix name matches', () => {
    const index = createSearchIndex(mockApps);
    const results = index.search('VS');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.app.name).toBe('VS Code');
  });

  it('should find partial name matches', () => {
    const index = createSearchIndex(mockApps);
    const results = index.search('Code');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should find description matches', () => {
    const index = createSearchIndex(mockApps);
    const results = index.search('terminal');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should find category matches', () => {
    const index = createSearchIndex(mockApps);
    const results = index.search('Terminal');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should return empty array for empty query', () => {
    const index = createSearchIndex(mockApps);
    const results = index.search('');
    expect(results).toEqual([]);
  });

  it('should return empty array for whitespace-only query', () => {
    const index = createSearchIndex(mockApps);
    const results = index.search('   ');
    expect(results).toEqual([]);
  });

  it('should respect limit parameter', () => {
    const index = createSearchIndex(mockApps);
    const results = index.search('e', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('should sort results by score descending', () => {
    const index = createSearchIndex(mockApps);
    const results = index.search('text');
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]?.score).toBeGreaterThanOrEqual(results[i]?.score);
    }
  });

  it('should include match information', () => {
    const index = createSearchIndex(mockApps);
    const results = index.search('VS Code');
    expect(results[0]?.matches).toContain('name:exact');
  });

  it('should add new apps to the index', () => {
    const index = createSearchIndex(mockApps);
    const newApp: App = {
      id: '5',
      slug: 'new-app',
      name: 'New App',
      description: 'A new application',
      url: 'https://example.com',
      isFree: true,
      isOpenSource: false,
      isAppStore: false,
      hasAwesomeList: false,
      categoryId: 'test',
      categoryName: 'Test',
    };
    index.add(newApp);
    const results = index.search('New App');
    expect(results).toHaveLength(1);
    expect(results[0]?.app.id).toBe('5');
  });

  it('should remove apps from the index', () => {
    const index = createSearchIndex(mockApps);
    // Before removal, we should find VS Code
    const beforeResults = index.search('VS Code');
    expect(beforeResults.length).toBeGreaterThan(0);

    // Remove VS Code by its ID
    index.remove('1');

    // After removal, VS Code should not be in results (but vscode might still match via tokens)
    const results = index.search('VS Code');
    expect(results.every((r) => r.app.id !== '1')).toBe(true);

    // Search for exact match should return nothing since both ID-based entries are removed
    const exactResults = index.search('VS Code').filter((r) => r.app.name === 'VS Code');
    expect(exactResults).toHaveLength(0);
  });

  it('should clear the index', () => {
    const index = createSearchIndex(mockApps);
    index.clear();
    const results = index.search('VS Code');
    expect(results).toHaveLength(0);
  });
});

describe('searchApps', () => {
  it('should return search results without maintaining index', () => {
    const results = searchApps(mockApps, 'VS');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should respect limit parameter', () => {
    const results = searchApps(mockApps, 'e', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });
});

describe('filterApps', () => {
  it('should filter by isFree', () => {
    const results = filterApps(mockApps, { isFree: true });
    expect(results.every((app) => app.isFree)).toBe(true);
    expect(results.length).toBe(3);
  });

  it('should filter by isOpenSource', () => {
    const results = filterApps(mockApps, { isOpenSource: true });
    expect(results.every((app) => app.isOpenSource)).toBe(true);
    expect(results.length).toBe(2);
  });

  it('should filter by isAppStore', () => {
    const results = filterApps(mockApps, { isAppStore: true });
    expect(results.every((app) => app.isAppStore)).toBe(true);
    expect(results.length).toBe(1);
  });

  it('should filter by categoryId', () => {
    const results = filterApps(mockApps, { categoryId: 'dev-tools' });
    expect(results.every((app) => app.categoryId === 'dev-tools')).toBe(true);
    expect(results.length).toBe(2);
  });

  it('should filter by parentCategoryId', () => {
    const results = filterApps(mockApps, { categoryId: 'parent-category' });
    expect(results.length).toBe(0);
  });

  it('should combine multiple filters', () => {
    const results = filterApps(mockApps, { isFree: true, isOpenSource: true });
    expect(results.every((app) => app.isFree && app.isOpenSource)).toBe(true);
    expect(results.length).toBe(2);
  });

  it('should return all apps when no filters provided', () => {
    const results = filterApps(mockApps, {});
    expect(results).toHaveLength(mockApps.length);
  });
});

describe('searchAndFilterApps', () => {
  it('should apply filters before searching', () => {
    const results = searchAndFilterApps(mockApps, 'text', { isFree: true });
    expect(results.every((r) => r.app.isFree)).toBe(true);
  });

  it('should return filtered apps when no query provided', () => {
    const results = searchAndFilterApps(mockApps, '', { isFree: true });
    expect(results.every((r) => r.app.isFree)).toBe(true);
  });

  it('should search within filtered results', () => {
    const results = searchAndFilterApps(mockApps, 'terminal', { isFree: true });
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('highlightMatches', () => {
  it('should return unhighlighted text for empty query', () => {
    const result = highlightMatches('Hello World', '');
    expect(result).toEqual([{ text: 'Hello World', highlighted: false }]);
  });

  it('should highlight exact matches', () => {
    const result = highlightMatches('Hello World', 'World');
    expect(result).toEqual([
      { text: 'Hello ', highlighted: false },
      { text: 'World', highlighted: true },
    ]);
  });

  it('should be case insensitive', () => {
    const result = highlightMatches('Hello World', 'world');
    expect(result).toEqual([
      { text: 'Hello ', highlighted: false },
      { text: 'World', highlighted: true },
    ]);
  });

  it('should highlight multiple occurrences', () => {
    const result = highlightMatches('test test test', 'test');
    expect(result).toEqual([
      { text: 'test', highlighted: true },
      { text: ' ', highlighted: false },
      { text: 'test', highlighted: true },
      { text: ' ', highlighted: false },
      { text: 'test', highlighted: true },
    ]);
  });

  it('should handle no matches', () => {
    const result = highlightMatches('Hello World', 'xyz');
    expect(result).toEqual([{ text: 'Hello World', highlighted: false }]);
  });

  it('should handle special characters in query', () => {
    const result = highlightMatches('Hello-World', 'Hello-');
    expect(result).toEqual([
      { text: 'Hello-', highlighted: true },
      { text: 'World', highlighted: false },
    ]);
  });
});
