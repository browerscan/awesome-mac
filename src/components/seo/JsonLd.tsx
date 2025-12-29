import { App, Category } from '@/types';
import { siteConfig, getAbsoluteUrl } from '@/lib/seo';
import type { JSX } from 'react';

/**
 * Base JSON-LD component wrapper
 */
function JsonLdScript({ data }: { data: object }): JSX.Element {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

/**
 * Organization schema for the site
 */
export function OrganizationJsonLd(): JSX.Element {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: getAbsoluteUrl('/logo.svg'),
    description: siteConfig.description,
    sameAs: [
      'https://github.com/jaywcjlove/awesome-mac',
      `https://twitter.com/${siteConfig.twitter.replace('@', '')}`,
    ],
    foundingDate: '2016',
    founder: {
      '@type': 'Person',
      name: siteConfig.creator,
      url: 'https://github.com/jaywcjlove',
    },
  };

  return <JsonLdScript data={data} />;
}

/**
 * Website schema with SearchAction
 */
export function WebsiteJsonLd(): JSX.Element {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: siteConfig.locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  return <JsonLdScript data={data} />;
}

/**
 * Software Application schema for app pages
 */
export function SoftwareApplicationJsonLd({ app }: { app: App }): JSX.Element {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: app.name,
    description: app.description,
    url: app.url,
    applicationCategory: mapCategoryToSchemaOrg(app.categoryName),
    operatingSystem: 'macOS',
    offers: {
      '@type': 'Offer',
      price: app.isFree ? '0' : undefined,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };

  // Add download URL if App Store
  if (app.isAppStore && app.appStoreUrl) {
    data.downloadUrl = app.appStoreUrl;
    data.installUrl = app.appStoreUrl;
  }

  // Add source code URL if open source
  if (app.isOpenSource && app.ossUrl) {
    data.codeRepository = app.ossUrl;
  }

  // Add software requirements
  data.softwareRequirements = 'macOS 10.15 or later';

  // Add breadcrumb reference
  data.isPartOf = {
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
  };

  return <JsonLdScript data={data} />;
}

/**
 * Breadcrumb schema for navigation
 */
export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }): JSX.Element {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: getAbsoluteUrl(item.href),
    })),
  };

  return <JsonLdScript data={data} />;
}

/**
 * ItemList schema for category pages
 */
export function ItemListJsonLd({ items }: { items: App[] }): JSX.Element {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.slice(0, 100).map((app, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: app.name,
        description: app.description,
        url: app.url,
        applicationCategory: mapCategoryToSchemaOrg(app.categoryName),
        operatingSystem: 'macOS',
        offers: {
          '@type': 'Offer',
          price: app.isFree ? '0' : undefined,
          priceCurrency: 'USD',
        },
      },
    })),
  };

  return <JsonLdScript data={data} />;
}

/**
 * CollectionPage schema for category pages
 */
export function CollectionPageJsonLd({ category }: { category: Category }): JSX.Element {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} - Mac Apps`,
    description:
      category.description ||
      `Browse ${category.apps.length} ${category.name} applications for Mac.`,
    url: getAbsoluteUrl(`/category/${category.slug}`),
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    about: {
      '@type': 'Thing',
      name: category.name,
    },
    numberOfItems: category.apps.length,
    hasPart: category.subcategories?.map((sub) => ({
      '@type': 'CollectionPage',
      name: sub.name,
      url: getAbsoluteUrl(`/category/${sub.slug}`),
    })),
  };

  return <JsonLdScript data={data} />;
}

/**
 * FAQ schema for FAQ pages
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export function FAQJsonLd({ items }: { items: FAQItem[] }): JSX.Element {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return <JsonLdScript data={data} />;
}

/**
 * Map category names to Schema.org application categories
 */
function mapCategoryToSchemaOrg(categoryName: string): string {
  const categoryMap: Record<string, string> = {
    // Development
    Editors: 'DeveloperApplication',
    'Development Tools': 'DeveloperApplication',
    'Developer Tools': 'DeveloperApplication',
    IDEs: 'DeveloperApplication',
    'Command Line Tools': 'DeveloperApplication',
    'Version Control': 'DeveloperApplication',
    Databases: 'DeveloperApplication',
    'API Development': 'DeveloperApplication',
    Terminal: 'DeveloperApplication',

    // Design
    Design: 'DesignApplication',
    'Graphic Design': 'DesignApplication',
    'UI/UX': 'DesignApplication',
    'Photo Editing': 'PhotographyApplication',
    'Video Editing': 'VideoApplication',
    '3D Modeling': 'DesignApplication',
    'Icon Design': 'DesignApplication',
    Prototyping: 'DesignApplication',
    'Screen Capture': 'PhotographyApplication',

    // Productivity
    Productivity: 'ProductivityApplication',
    'Note Taking': 'ProductivityApplication',
    'Task Management': 'ProductivityApplication',
    Calendar: 'ProductivityApplication',
    'Time Tracking': 'ProductivityApplication',
    Clipboard: 'ProductivityApplication',
    'Window Management': 'ProductivityApplication',
    Launcher: 'ProductivityApplication',
    Automation: 'ProductivityApplication',

    // Communication
    Communication: 'CommunicationApplication',
    Email: 'CommunicationApplication',
    Messaging: 'CommunicationApplication',
    'Video Conferencing': 'CommunicationApplication',
    Social: 'SocialNetworkingApplication',

    // Utilities
    Utilities: 'UtilitiesApplication',
    Security: 'SecurityApplication',
    Backup: 'UtilitiesApplication',
    Cleaning: 'UtilitiesApplication',
    'System Tools': 'UtilitiesApplication',
    'File Management': 'UtilitiesApplication',
    'Disk Utilities': 'UtilitiesApplication',

    // Entertainment
    Music: 'MusicApplication',
    Video: 'VideoApplication',
    Podcast: 'EntertainmentApplication',
    Games: 'GameApplication',
    Entertainment: 'EntertainmentApplication',

    // Education
    Education: 'EducationApplication',
    Reference: 'ReferenceApplication',
    Reading: 'BookApplication',

    // Business
    Business: 'BusinessApplication',
    Finance: 'FinanceApplication',

    // Internet
    Browsers: 'BrowserApplication',
    'Download Tools': 'UtilitiesApplication',
    'Cloud Storage': 'UtilitiesApplication',
    VPN: 'SecurityApplication',

    // Writing
    Writing: 'ProductivityApplication',
    Markdown: 'ProductivityApplication',
    'Text Editors': 'ProductivityApplication',

    // AI
    AI: 'DeveloperApplication',
    'AI Clients': 'DeveloperApplication',
    'Machine Learning': 'DeveloperApplication',
  };

  // Check for exact match first
  if (categoryMap[categoryName]) {
    return categoryMap[categoryName];
  }

  // Check for partial match
  const lowerName = categoryName.toLowerCase();
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lowerName.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Default to generic application
  return 'Application';
}

/**
 * Combined structured data for homepage
 */
export function HomePageJsonLd(): JSX.Element {
  return (
    <>
      <OrganizationJsonLd />
      <WebsiteJsonLd />
    </>
  );
}

/**
 * Combined structured data for app detail page
 */
export function AppPageJsonLd({
  app,
  breadcrumbs,
}: {
  app: App;
  breadcrumbs: BreadcrumbItem[];
}): JSX.Element {
  return (
    <>
      <SoftwareApplicationJsonLd app={app} />
      <BreadcrumbJsonLd items={breadcrumbs} />
    </>
  );
}

/**
 * Combined structured data for category page
 */
export function CategoryPageJsonLd({
  category,
  breadcrumbs,
}: {
  category: Category;
  breadcrumbs: BreadcrumbItem[];
}): JSX.Element {
  return (
    <>
      <CollectionPageJsonLd category={category} />
      <ItemListJsonLd items={category.apps} />
      <BreadcrumbJsonLd items={breadcrumbs} />
    </>
  );
}
