import type { Metadata } from 'next';
import { App, Category } from '@/types';

/**
 * Site configuration for SEO
 */
export const siteConfig = {
  name: 'Awesome Mac Apps',
  title: 'Awesome Mac Apps - Best macOS Applications',
  description:
    'Curated collection of awesome Mac applications for developers and designers. Discover free, open-source, and premium macOS software.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://jaywcjlove.github.io/awesome-mac',
  ogImage: '/opengraph-image',
  twitter: '@awesome_mac',
  locale: 'en-US',
  author: 'Awesome Mac Community',
  creator: 'jaywcjlove',
  keywords: [
    'mac apps',
    'macos applications',
    'macOS software',
    'developer tools',
    'designer tools',
    'open source mac',
    'free mac apps',
    'productivity apps',
    'awesome mac',
    'mac utilities',
    'mac development',
  ],
} as const;

/**
 * Generate metadata for any page
 */
export function generateMetadata(options: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
}): Metadata {
  const {
    title,
    description = siteConfig.description,
    path = '',
    image = siteConfig.ogImage,
    type = 'website',
    noIndex = false,
    publishedTime,
    modifiedTime,
    authors,
    tags,
  } = options;

  const url = `${siteConfig.url}${path}`;
  const imageUrl = image.startsWith('http') ? image : `${siteConfig.url}${image}`;

  const metadata: Metadata = {
    title: title || siteConfig.title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type,
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title: title || siteConfig.title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title || siteConfig.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: siteConfig.twitter,
      creator: siteConfig.twitter,
      title: title || siteConfig.title,
      description,
      images: [imageUrl],
    },
  };

  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
    };
  }

  if (type === 'article' && metadata.openGraph) {
    const articleMeta = metadata.openGraph as Record<string, unknown>;
    if (publishedTime) articleMeta.publishedTime = publishedTime;
    if (modifiedTime) articleMeta.modifiedTime = modifiedTime;
    if (authors) articleMeta.authors = authors;
    if (tags) articleMeta.tags = tags;
  }

  return metadata;
}

/**
 * Generate metadata for an app detail page
 */
export function generateAppMetadata(app: App): Metadata {
  const badges: string[] = [];
  if (app.isFree) badges.push('Free');
  if (app.isOpenSource) badges.push('Open Source');
  if (app.isAppStore) badges.push('App Store');

  const badgeText = badges.length > 0 ? ` [${badges.join(', ')}]` : '';
  const title = `${app.name}${badgeText} - Mac App`;
  const description =
    app.description ||
    `${app.name} is a Mac application in the ${app.categoryName} category.${badgeText ? ` Available as ${badges.join(', ').toLowerCase()}.` : ''}`;

  return generateMetadata({
    title,
    description: description.slice(0, 160),
    path: `/apps/${app.slug}`,
    type: 'article',
    tags: [
      app.categoryName,
      ...(app.isFree ? ['free'] : []),
      ...(app.isOpenSource ? ['open source'] : []),
      ...(app.isAppStore ? ['app store'] : []),
    ],
  });
}

/**
 * Generate metadata for a category page
 */
export function generateCategoryMetadata(category: Category): Metadata {
  const appCount = category.apps.length;
  const subcategoryCount = category.subcategories?.length || 0;

  let description = category.description;
  if (!description) {
    description = `Browse ${appCount} ${category.name} apps for Mac.`;
    if (subcategoryCount > 0) {
      description += ` Explore ${subcategoryCount} subcategories including `;
      description += category
        .subcategories!.slice(0, 3)
        .map((s) => s.name)
        .join(', ');
      if (subcategoryCount > 3) description += ', and more';
      description += '.';
    }
  }

  return generateMetadata({
    title: `${category.name} - Mac Apps`,
    description: description.slice(0, 160),
    path: `/category/${category.slug}`,
    tags: [category.name, ...(category.subcategories?.map((s) => s.name) || [])],
  });
}

/**
 * Generate search page metadata with query
 */
export function generateSearchMetadata(query?: string): Metadata {
  const title = query ? `Search results for "${query}" - Mac Apps` : 'Search Mac Apps';
  const description = query
    ? `Find Mac applications matching "${query}". Browse our curated collection of macOS software.`
    : 'Search our curated collection of Mac applications. Find developer tools, productivity apps, and more.';

  return generateMetadata({
    title,
    description,
    path: '/search',
    noIndex: true,
  });
}

/**
 * Truncate text for meta descriptions (max 160 chars)
 */
export function truncateDescription(text: string, maxLength = 160): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trim() + '...';
}

/**
 * Generate a slug-friendly string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Get absolute URL for a path
 */
export function getAbsoluteUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`;
}
