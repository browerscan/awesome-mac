import { ASTNode, App, Category, ParsedData, AppMark, TextNode } from '@/types';
import { slugify, generateId } from './slugify';

/**
 * Extract description text from paragraph children
 */
function extractDescription(children: unknown[]): string {
  let description = '';

  for (const child of children) {
    const node = child as Record<string, unknown>;
    if (node.type === 'text' && typeof node.value === 'string') {
      description += node.value;
    } else if (node.type === 'link' && Array.isArray(node.children)) {
      // Skip the link text (it's the app name)
      continue;
    }
  }

  // Clean up the description
  return description
    .replace(/^\s*-\s*/, '') // Remove leading dash
    .replace(/\s+$/, '') // Trim trailing whitespace
    .trim();
}

/**
 * Parse the raw AST data into structured categories and apps
 */
export function parseData(rawData: ASTNode[]): ParsedData {
  const categories: Category[] = [];
  const apps: App[] = [];
  const categoryMap = new Map<string, Category>();
  const appMap = new Map<string, App>();

  let currentMainCategory: Category | null = null;
  let currentSubCategory: Category | null = null;
  let currentDescription: string | undefined;

  for (const node of rawData) {
    if (node.type === 'heading') {
      if (node.depth === 2) {
        // Main category
        const id = generateId(node.value);
        currentMainCategory = {
          id,
          slug: slugify(node.value),
          name: node.value,
          depth: 2,
          apps: [],
          subcategories: [],
        };
        currentSubCategory = null;
        currentDescription = undefined;
        categories.push(currentMainCategory);
        categoryMap.set(id, currentMainCategory);
      } else if (node.depth === 3 && currentMainCategory) {
        // Sub-category
        const id = generateId(node.value, currentMainCategory.id);
        currentSubCategory = {
          id,
          slug: slugify(node.value),
          name: node.value,
          depth: 3,
          parentId: currentMainCategory.id,
          parentName: currentMainCategory.name,
          apps: [],
        };
        currentDescription = undefined;
        currentMainCategory.subcategories?.push(currentSubCategory);
        categoryMap.set(id, currentSubCategory);
      }
    } else if (node.type === 'paragraph' && 'children' in node) {
      // Category description
      const children = node.children as Array<{
        type: string;
        children?: TextNode[];
        value?: string;
      }>;
      const emphasisChild = children.find((c) => c.type === 'emphasis');
      if (emphasisChild?.children?.[0]?.value) {
        currentDescription = emphasisChild.children[0].value;
        if (currentSubCategory) {
          currentSubCategory.description = currentDescription;
        } else if (currentMainCategory) {
          currentMainCategory.description = currentDescription;
        }
      }
    } else if (node.type === 'list' && 'children' in node) {
      // List of apps
      const listItems = node.children as Array<{
        type: string;
        children: Array<{ type: string; children: unknown[]; mark?: AppMark }>;
      }>;

      for (const item of listItems) {
        if (item.type !== 'listItem') continue;

        const paragraph = item.children?.find((c) => c.type === 'paragraph');
        if (!paragraph?.mark) continue;

        const mark = paragraph.mark;
        if (mark.delete) continue; // Skip deleted apps

        const targetCategory = currentSubCategory || currentMainCategory;
        if (!targetCategory) continue;

        const title = typeof mark.title === 'string' ? mark.title.trim() : '';
        const url = typeof mark.url === 'string' ? mark.url.trim() : '';
        const icons = Array.isArray(mark.icons) ? mark.icons : [];

        // Some list items in the markdown may be malformed; skip them safely.
        if (!title || !url) continue;

        const appId = generateId(title, targetCategory.id);
        const description = extractDescription(paragraph.children);

        const app: App = {
          id: appId,
          slug: slugify(title),
          name: title,
          description,
          url,
          isFree: icons.some((i) => i.type === 'freeware'),
          isOpenSource: icons.some((i) => i.type === 'oss'),
          isAppStore: icons.some((i) => i.type === 'app-store'),
          hasAwesomeList: icons.some((i) => i.type === 'awesome-list'),
          ossUrl: icons.find((i) => i.type === 'oss')?.url,
          appStoreUrl: icons.find((i) => i.type === 'app-store')?.url,
          awesomeListUrl: icons.find((i) => i.type === 'awesome-list')?.url,
          categoryId: targetCategory.id,
          categoryName: targetCategory.name,
          parentCategoryId: targetCategory.parentId,
          parentCategoryName: targetCategory.parentName,
        };

        targetCategory.apps.push(app);
        apps.push(app);
        appMap.set(appId, app);
        appMap.set(app.slug, app); // Also index by slug for lookup
      }
    }
  }

  return { categories, apps, categoryMap, appMap };
}
