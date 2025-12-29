import { getPayload } from 'payload';
import config from '@payload-config';
import { fetchReadme } from './github-sync';
import { parseData } from './parser';
import { ASTNode, App } from '@/types';
import path from 'path';
import fs from 'fs/promises';

interface SyncResult {
  success: boolean;
  categoriesCreated: number;
  categoriesUpdated: number;
  appsCreated: number;
  appsUpdated: number;
  errors: string[];
  duration: number;
}

interface SyncOptions {
  language?: 'en' | 'zh';
  forceRefresh?: boolean;
  useLocalFile?: boolean;
}

/**
 * Parse markdown content to AST using remark
 * This is a simplified version - in production, use the full remark parser
 */
async function parseMarkdownToAST(markdown: string): Promise<ASTNode[]> {
  // For now, we'll use the local JSON file that's already been parsed
  // In production, you would use remark to parse the markdown directly
  throw new Error('Direct markdown parsing not implemented. Use useLocalFile option.');
}

/**
 * Load AST data from local JSON file
 */
async function loadLocalAST(language: 'en' | 'zh' = 'zh'): Promise<ASTNode[]> {
  const filename = language === 'zh' ? 'awesome-mac.zh.json' : 'awesome-mac.json';
  const filePath = path.join(process.cwd(), 'dist', filename);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // Fallback to default file
    const fallbackPath = path.join(process.cwd(), 'dist', 'awesome-mac.json');
    const content = await fs.readFile(fallbackPath, 'utf-8');
    return JSON.parse(content);
  }
}

/**
 * Sync data from GitHub/local files to PayloadCMS database
 */
export async function syncToPayload(options: SyncOptions = {}): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = {
    success: false,
    categoriesCreated: 0,
    categoriesUpdated: 0,
    appsCreated: 0,
    appsUpdated: 0,
    errors: [],
    duration: 0,
  };

  try {
    const payload = await getPayload({ config });

    // Load and parse data
    let astData: ASTNode[];

    if (options.useLocalFile !== false) {
      // Default to using local file
      astData = await loadLocalAST(options.language);
    } else {
      // Fetch from GitHub and parse
      const markdown = await fetchReadme({
        language: options.language,
        forceRefresh: options.forceRefresh,
      });
      astData = await parseMarkdownToAST(markdown);
    }

    const { categories, apps } = parseData(astData);

    // Create a map of category slugs to IDs for relationship linking
    const categoryIdMap = new Map<string, string | number>();

    // Sync categories
    for (const category of categories) {
      try {
        // Check if category exists by slug
        const existingCategories = await payload.find({
          collection: 'categories',
          where: {
            slug: { equals: category.slug },
          },
          limit: 1,
        });

        if (existingCategories.docs.length > 0) {
          // Update existing category
          const updated = await payload.update({
            collection: 'categories',
            id: existingCategories.docs[0].id,
            data: {
              name: category.name,
              description: category.description,
              order: categories.indexOf(category),
            },
          });
          categoryIdMap.set(category.id, updated.id);
          result.categoriesUpdated++;
        } else {
          // Create new category
          const created = await payload.create({
            collection: 'categories',
            data: {
              name: category.name,
              slug: category.slug,
              description: category.description,
              order: categories.indexOf(category),
            },
          });
          categoryIdMap.set(category.id, created.id);
          result.categoriesCreated++;
        }

        // Handle subcategories
        if (category.subcategories) {
          for (const sub of category.subcategories) {
            try {
              const existingSubs = await payload.find({
                collection: 'categories',
                where: {
                  slug: { equals: sub.slug },
                },
                limit: 1,
              });

              if (existingSubs.docs.length > 0) {
                const updated = await payload.update({
                  collection: 'categories',
                  id: existingSubs.docs[0].id,
                  data: {
                    name: sub.name,
                    description: sub.description,
                  },
                });
                categoryIdMap.set(sub.id, updated.id);
                result.categoriesUpdated++;
              } else {
                const created = await payload.create({
                  collection: 'categories',
                  data: {
                    name: sub.name,
                    slug: sub.slug,
                    description: sub.description,
                  },
                });
                categoryIdMap.set(sub.id, created.id);
                result.categoriesCreated++;
              }
            } catch (error) {
              result.errors.push(`Failed to sync subcategory ${sub.name}: ${error}`);
            }
          }
        }
      } catch (error) {
        result.errors.push(`Failed to sync category ${category.name}: ${error}`);
      }
    }

    // Sync apps
    for (const app of apps) {
      try {
        // Find the PayloadCMS category ID
        const categoryPayloadId = categoryIdMap.get(app.categoryId);

        if (!categoryPayloadId) {
          result.errors.push(`Category not found for app ${app.name}: ${app.categoryId}`);
          continue;
        }

        // Check if app exists by URL (unique identifier)
        const existingApps = await payload.find({
          collection: 'apps',
          where: {
            url: { equals: app.url },
          },
          limit: 1,
        });

        const appData = {
          name: app.name,
          slug: app.slug,
          url: app.url,
          description: app.description,
          category: categoryPayloadId,
          isFree: app.isFree,
          isOpenSource: app.isOpenSource,
          hasAppStore: app.isAppStore,
          githubUrl: app.ossUrl,
        };

        if (existingApps.docs.length > 0) {
          // Update existing app
          await payload.update({
            collection: 'apps',
            id: existingApps.docs[0].id,
            data: appData,
          });
          result.appsUpdated++;
        } else {
          // Create new app
          await payload.create({
            collection: 'apps',
            data: appData,
          });
          result.appsCreated++;
        }
      } catch (error) {
        result.errors.push(`Failed to sync app ${app.name}: ${error}`);
      }
    }

    result.success = true;
  } catch (error) {
    result.errors.push(`Sync failed: ${error}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Get sync status and statistics
 */
export async function getSyncStats(): Promise<{
  totalCategories: number;
  totalApps: number;
  lastSync: Date | null;
}> {
  try {
    const payload = await getPayload({ config });

    const [categories, apps] = await Promise.all([
      payload.count({ collection: 'categories' }),
      payload.count({ collection: 'apps' }),
    ]);

    return {
      totalCategories: categories.totalDocs,
      totalApps: apps.totalDocs,
      lastSync: null, // Could be stored in a settings collection
    };
  } catch {
    return {
      totalCategories: 0,
      totalApps: 0,
      lastSync: null,
    };
  }
}
