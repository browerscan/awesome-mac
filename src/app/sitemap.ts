import type { MetadataRoute } from 'next';
import { getAllApps, getCategories } from '@/lib/data';
import { siteConfig } from '@/lib/seo';
import { routing } from '@/i18n/routing';

export const runtime = 'nodejs';

const locales = routing.locales; // ['en', 'zh']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apps = await getAllApps();
  const categories = await getCategories();
  const now = new Date();

  // Helper to create entries for all locales with hreflang
  const createLocalizedEntries = (
    path: string,
    options: {
      changeFrequency?: MetadataRoute.Sitemap[0]['changeFrequency'];
      priority?: number;
    } = {}
  ): MetadataRoute.Sitemap => {
    const entries: MetadataRoute.Sitemap = [];
    for (const locale of locales) {
      const localePath = locale === 'en' ? path : `/${locale}${path}`;
      entries.push({
        url: `${siteConfig.url}${localePath}`,
        lastModified: now,
        changeFrequency: options.changeFrequency,
        priority: options.priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [
              l,
              l === 'en' ? `${siteConfig.url}${path}` : `${siteConfig.url}/${l}${path}`,
            ])
          ),
        },
      });
    }
    return entries;
  };

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    ...createLocalizedEntries('', { changeFrequency: 'daily', priority: 1.0 }),
    ...createLocalizedEntries('/apps', { changeFrequency: 'daily', priority: 0.9 }),
    ...createLocalizedEntries('/categories', { changeFrequency: 'weekly', priority: 0.8 }),
    ...createLocalizedEntries('/search', { changeFrequency: 'weekly', priority: 0.5 }),
    // Programmatic SEO pages
    ...createLocalizedEntries('/free', { changeFrequency: 'weekly', priority: 0.9 }),
    ...createLocalizedEntries('/open-source', { changeFrequency: 'weekly', priority: 0.9 }),
  ];

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = [];
  for (const category of categories) {
    categoryPages.push(
      ...createLocalizedEntries(`/category/${category.slug}`, {
        changeFrequency: 'weekly',
        priority: 0.8,
      }),
      // Best apps by category pages
      ...createLocalizedEntries(`/best/${category.slug}`, {
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    );

    // Subcategories
    for (const sub of category.subcategories || []) {
      categoryPages.push(
        ...createLocalizedEntries(`/category/${sub.slug}`, {
          changeFrequency: 'weekly',
          priority: 0.7,
        }),
        // Best apps by subcategory pages
        ...createLocalizedEntries(`/best/${sub.slug}`, {
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      );
    }
  }

  // App pages - deduplicate by slug
  const uniqueSlugs = new Set<string>();
  const appPages: MetadataRoute.Sitemap = [];

  for (const app of apps) {
    if (!uniqueSlugs.has(app.slug)) {
      uniqueSlugs.add(app.slug);
      appPages.push(
        ...createLocalizedEntries(`/apps/${app.slug}`, {
          changeFrequency: 'monthly',
          priority: 0.6,
        }),
        // Free alternatives pages for non-free apps
        ...createLocalizedEntries(`/free-alternatives/${app.slug}`, {
          changeFrequency: 'monthly',
          priority: 0.5,
        })
      );
    }
  }

  return [...staticPages, ...categoryPages, ...appPages];
}
