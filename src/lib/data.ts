import { parseData } from './parser';
import { ASTNode, App, Category, ParsedData } from '@/types';
import { ERROR_MESSAGES } from '@/constants';
import path from 'path';
import fs from 'fs/promises';

const DATA_FILE_PATH = 'dist/awesome-mac.json';

interface CachedData {
  mtimeMs: number;
  data: ParsedData;
}

let cachedParsed: CachedData | null = null;

/**
 * Load and parse the awesome-mac data from JSON
 * Cached to avoid repeated parsing across requests (when running on Node runtime).
 */
export async function getData(): Promise<ParsedData> {
  const filePath = path.join(process.cwd(), DATA_FILE_PATH);

  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch (err) {
    throw new Error(`${ERROR_MESSAGES.DATA_FILE_MISSING} (${String(err)})`);
  }

  if (cachedParsed?.mtimeMs === stat.mtimeMs) {
    return cachedParsed.data;
  }

  const fileContent = await fs.readFile(filePath, 'utf-8');
  const rawData: ASTNode[] = JSON.parse(fileContent);
  const data = parseData(rawData);
  cachedParsed = { mtimeMs: stat.mtimeMs, data };
  return data;
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  const { categories } = await getData();
  return categories;
}

/**
 * Get a category by its ID or slug
 */
export async function getCategoryById(idOrSlug: string): Promise<Category | undefined> {
  const { categories } = await getData();

  // First try direct ID match
  for (const category of categories) {
    if (category.id === idOrSlug || category.slug === idOrSlug) {
      return category;
    }
    // Check subcategories
    for (const sub of category.subcategories || []) {
      if (sub.id === idOrSlug || sub.slug === idOrSlug) {
        return sub;
      }
    }
  }

  return undefined;
}

/**
 * Get all apps
 */
export async function getAllApps(): Promise<App[]> {
  const { apps } = await getData();
  return apps;
}

/**
 * Get an app by its slug
 */
export async function getAppBySlug(slug: string): Promise<App | undefined> {
  const { apps } = await getData();
  return apps.find((app) => app.slug === slug);
}

/**
 * Get apps by category ID
 */
export async function getAppsByCategory(categoryId: string): Promise<App[]> {
  const { apps } = await getData();
  return apps.filter((app) => app.categoryId === categoryId || app.parentCategoryId === categoryId);
}

/**
 * Search apps by name or description
 */
export async function searchApps(query: string): Promise<App[]> {
  const { apps } = await getData();
  const lowerQuery = query.toLowerCase();

  return apps.filter(
    (app) =>
      app.name.toLowerCase().includes(lowerQuery) ||
      app.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get all unique app slugs for static generation
 */
export async function getAllAppSlugs(): Promise<string[]> {
  const { apps } = await getData();
  return [...new Set(apps.map((app) => app.slug))];
}

/**
 * Get all category IDs for static generation
 */
export async function getAllCategoryIds(): Promise<string[]> {
  const { categories } = await getData();
  const ids: string[] = [];

  for (const category of categories) {
    ids.push(category.id);
    for (const sub of category.subcategories || []) {
      ids.push(sub.id);
    }
  }

  return ids;
}
