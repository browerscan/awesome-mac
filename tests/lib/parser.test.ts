import { describe, it, expect } from 'vitest';
import { parseData } from '@/lib/parser';
import type { ASTNode } from '@/types';

// Mock data for testing
const mockHeadingNode: ASTNode = {
  type: 'heading',
  depth: 2,
  value: 'Development Tools',
};

const mockSubHeadingNode: ASTNode = {
  type: 'heading',
  depth: 3,
  value: 'Text Editors',
};

const mockDescriptionNode: ASTNode = {
  type: 'paragraph',
  children: [
    {
      type: 'emphasis',
      children: [{ type: 'text', value: 'Tools for software development' }],
    },
  ],
};

const mockListNode: ASTNode = {
  type: 'list',
  ordered: false,
  start: null,
  spread: false,
  children: [
    {
      type: 'listItem',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              title: null,
              url: 'https://example.com/vscode',
              children: [],
            },
            {
              type: 'text',
              value: ' - A powerful text editor',
            },
          ],
          mark: {
            title: 'VS Code',
            url: 'https://example.com/vscode',
            icons: [
              { type: 'freeware', url: 'https://example.com/freeware' },
              { type: 'oss', url: 'https://github.com/microsoft/vscode' },
            ],
          },
        },
      ],
    },
    {
      type: 'listItem',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              title: null,
              url: 'https://example.com/deleted-app',
              children: [],
            },
            {
              type: 'text',
              value: ' - Deleted app',
            },
          ],
          mark: {
            title: 'Deleted App',
            url: 'https://example.com/deleted-app',
            icons: [],
            delete: true,
          },
        },
      ],
    },
  ],
};

describe('parseData', () => {
  it('should parse a main category heading', () => {
    const result = parseData([mockHeadingNode]);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0]).toMatchObject({
      name: 'Development Tools',
      depth: 2,
      slug: 'development-tools',
    });
  });

  it('should parse a subcategory heading', () => {
    const data: ASTNode[] = [mockHeadingNode, mockSubHeadingNode];
    const result = parseData(data);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].subcategories?.length).toBeGreaterThanOrEqual(1);
    expect(result.categories[0].subcategories?.[0]).toMatchObject({
      name: 'Text Editors',
      depth: 3,
      slug: 'text-editors',
      parentId: 'development-tools',
    });
  });

  it('should parse category description', () => {
    const data: ASTNode[] = [mockHeadingNode, mockDescriptionNode];
    const result = parseData(data);
    expect(result.categories[0].description).toBe('Tools for software development');
  });

  it('should parse apps from list items', () => {
    const data: ASTNode[] = [mockHeadingNode, mockListNode];
    const result = parseData(data);
    expect(result.apps).toHaveLength(1);
    expect(result.apps[0]).toMatchObject({
      name: 'VS Code',
      url: 'https://example.com/vscode',
      description: 'A powerful text editor',
      isFree: true,
      isOpenSource: true,
      isAppStore: false,
      hasAwesomeList: false,
    });
  });

  it('should skip deleted apps', () => {
    const data: ASTNode[] = [mockHeadingNode, mockListNode];
    const result = parseData(data);
    expect(result.apps).toHaveLength(1);
    expect(result.apps[0].name).toBe('VS Code');
  });

  it('should create unique IDs for apps', () => {
    const data: ASTNode[] = [mockHeadingNode, mockListNode];
    const result = parseData(data);
    const appIds = result.apps.map((app) => app.id);
    const uniqueIds = new Set(appIds);
    expect(uniqueIds.size).toBe(appIds.length);
  });

  it('should build category map correctly', () => {
    const data: ASTNode[] = [mockHeadingNode, mockSubHeadingNode];
    const result = parseData(data);
    expect(result.categoryMap.size).toBe(2);
    expect(result.categoryMap.has('development-tools')).toBe(true);
    expect(result.categoryMap.has('development-tools-text-editors')).toBe(true);
  });

  it('should build app map correctly', () => {
    const data: ASTNode[] = [mockHeadingNode, mockListNode];
    const result = parseData(data);
    expect(result.appMap.size).toBeGreaterThan(0);
    const firstApp = result.apps[0];
    if (firstApp) {
      expect(result.appMap.has(firstApp.id)).toBe(true);
      expect(result.appMap.has(firstApp.slug)).toBe(true);
    }
  });

  it('should handle empty input', () => {
    const result = parseData([]);
    expect(result.categories).toEqual([]);
    expect(result.apps).toEqual([]);
    expect(result.categoryMap.size).toBe(0);
    expect(result.appMap.size).toBe(0);
  });

  it('should parse OSS URL from icon', () => {
    const data: ASTNode[] = [mockHeadingNode, mockListNode];
    const result = parseData(data);
    expect(result.apps[0]?.ossUrl).toBe('https://github.com/microsoft/vscode');
  });

  it('should associate apps with the current category', () => {
    const data: ASTNode[] = [mockHeadingNode, mockListNode];
    const result = parseData(data);
    expect(result.categories[0].apps.length).toBeGreaterThanOrEqual(1);
    expect(result.categories[0].apps[0]?.name).toBe('VS Code');
    expect(result.categories[0].apps[0]?.categoryId).toBe('development-tools');
  });
});
