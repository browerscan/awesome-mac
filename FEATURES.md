# Features

This document provides an overview of all features implemented in the Awesome Mac web application.

## Table of Contents

- [Core Features](#core-features)
- [SEO Pages](#seo-pages)
- [Internationalization](#internationalization)
- [Analytics](#analytics)
- [API](#api)
- [Security](#security)
- [Performance](#performance)

---

## Core Features

### Search Functionality

- **Typeahead Search**: Real-time search suggestions as you type
- **Server-Side Search**: Search API endpoint avoids shipping full app list to client
- **Smart Scoring**: Search results ranked by relevance (exact match > prefix > contains)
- **Token-Based Matching**: Searches across app names, descriptions, and categories
- **Pagination**: Support for paginated results (configurable page size)
- **Suggestions**: Auto-generated suggestions when no results found

**Implementation**: `src/lib/search/index.ts`, `src/app/api/search/route.ts`

### Filtering

- **Free Apps Filter**: Browse only freeware applications
- **Open Source Filter**: Browse only open-source applications
- **Category Filter**: Filter by specific category
- **Combined Filters**: Apply multiple filters simultaneously

**Implementation**: `src/lib/search/index.ts`

### App Detail Pages

- **Individual App Pages**: Dedicated page for each application
- **Rich Metadata**: Open Graph, Twitter Cards, JSON-LD structured data
- **Badge Display**: Free, Open Source, App Store, Awesome List badges
- **Related Links**: Direct links to website, GitHub, App Store
- **Category Navigation**: Browse related apps in the same category

**Implementation**: `src/app/[locale]/apps/[slug]/page.tsx`

### Category Pages

- **Category Listings**: All apps within a category
- **Subcategory Support**: Nested category structure
- **Category Metadata**: Descriptions and app counts
- **Breadcrumb Navigation**: Easy navigation back to parent categories

**Implementation**: `src/app/[locale]/category/[slug]/page.tsx`

### Recently Added

- **Newest Apps**: Displays recently added applications
- **Automatic Updates**: Derived from the source markdown order
- **Configurable Display**: Adjustable number of items shown

**Implementation**: `src/components/RecentlyAdded.tsx`

---

## SEO Pages

The application includes programmatic SEO pages for discoverability:

### Static SEO Pages

| Path          | Description                                 |
| ------------- | ------------------------------------------- |
| `/`           | Home page with featured apps and categories |
| `/apps`       | All apps listing with filters               |
| `/categories` | All categories listing                      |
| `/search`     | Dedicated search page                       |

### Programmatic SEO Pages

| Path Pattern                | Description                    | Example                           |
| --------------------------- | ------------------------------ | --------------------------------- |
| `/free`                     | Free apps only                 | `/free`                           |
| `/open-source`              | Open source apps only          | `/open-source`                    |
| `/category/[slug]`          | Category page                  | `/category/developer-tools`       |
| `/apps/[slug]`              | Individual app page            | `/apps/visual-studio-code`        |
| `/best/[category]`          | Best apps by category          | `/best/developer-tools`           |
| `/free-alternatives/[slug]` | Free alternatives to paid apps | `/free-alternatives/sublime-text` |
| `/compare/[...slugs]`       | Compare multiple apps          | `/compare/vscode/sublime-text`    |

**Implementation**: `src/app/sitemap.ts` (dynamic sitemap generation)

### SEO Features

- **Dynamic Sitemap**: Auto-generated sitemap with all pages
- **Robots.txt**: Configured robots.txt for crawler guidance
- **Structured Data**: JSON-LD for apps and categories
- **Meta Tags**: Comprehensive Open Graph and Twitter Card tags
- **Canonical URLs**: Proper canonicalization for SEO
- **Hreflang Tags**: Language alternate tags for i18n

**Implementation**: `src/lib/seo.ts`, `src/components/seo/JsonLd.tsx`

---

## Internationalization

### Supported Languages

| Code | Language | Path Prefix |
| ---- | -------- | ----------- |
| `en` | English  | (default)   |
| `zh` | Chinese  | `/zh`       |

### i18n Features

- **Locale Routing**: Automatic locale detection and routing
- **Translated Content**: Full translation support for UI text
- **URL Prefixes**: Language-prefixed URLs for non-default locales
- **Language Switcher**: Easy switching between supported languages
- **Message Files**: JSON-based translation files

**Translation Files**: `messages/en.json`, `messages/zh.json`

**Implementation**: `src/i18n/routing.ts`, `src/i18n/request.ts`

---

## Analytics

### Google Analytics 4 Integration

- **Page View Tracking**: Automatic page view tracking
- **Event Tracking**: Custom events for user interactions
- **Web Vitals**: Core Web Vitals reporting (LCP, FID, CLS, FCP, INP, TTFB)
- **Search Analytics**: Search query and result tracking
- **E-commerce Events**: App click, external visit tracking

### Tracked Events

| Event             | Parameters                           | Description                    |
| ----------------- | ------------------------------------ | ------------------------------ |
| `search`          | search_term, results_count           | User performed a search        |
| `view_item`       | item_name, item_category             | App detail page viewed         |
| `click`           | event_label                          | App card clicked               |
| `external_visit`  | app_name, destination_url, link_type | External link clicked          |
| `github_click`    | repo_name                            | GitHub repository link clicked |
| `language_switch` | from_language, to_language           | Language changed               |

### Consent Management

- **Consent API**: Functions for granting/denying analytics consent
- **LocalStorage**: Persists user consent preference
- **GDPR Ready**: Built-in consent management for GDPR compliance

**Implementation**: `src/components/Analytics.tsx`

---

## API

### Search API

**Endpoint**: `GET /api/search`

**Query Parameters**:

- `q` (string): Search query
- `page` (number): Page number (default: 1, max: 100)
- `limit` (number): Results per page (default: 10, max: 50)

**Response**:

```json
{
  "q": "vscode",
  "results": [
    {
      "id": "app-id",
      "slug": "visual-studio-code",
      "name": "Visual Studio Code",
      "description": "Code editor...",
      "categoryId": "category-id",
      "categoryName": "Developer Tools",
      "isFree": true,
      "isOpenSource": true,
      "isAppStore": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "hasMore": true
  },
  "suggestions": ["VS Code", "Code Editor"],
  "analytics": {
    "searchId": "uuid",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Rate Limiting**: 60 requests per minute per IP

**Documentation**: See `API.md` for full API reference.

### Web Vitals API

**Endpoint**: `POST /api/vitals`

**Body**:

```json
{
  "name": "LCP",
  "value": 1234,
  "rating": "good",
  "delta": 100,
  "id": "metric-id",
  "page": "/apps/visual-studio-code"
}
```

**Rate Limiting**: 10 requests per minute per IP

---

## Security

### Security Headers

| Header                         | Value                             | Purpose                               |
| ------------------------------ | --------------------------------- | ------------------------------------- |
| `X-Frame-Options`              | `DENY`                            | Prevent clickjacking                  |
| `X-Content-Type-Options`       | `nosniff`                         | Prevent MIME sniffing                 |
| `Referrer-Policy`              | `strict-origin-when-cross-origin` | Control referrer information          |
| `Permissions-Policy`           | (various)                         | Control browser features              |
| `Cross-Origin-Resource-Policy` | `same-origin`                     | Control cross-origin resource sharing |
| `Strict-Transport-Security`    | (production only)                 | Enforce HTTPS                         |

**Implementation**: `src/middleware.ts`, `next.config.ts`

### Input Validation

- **Zod Schemas**: Request validation using Zod
- **Query Sanitization**: Search query sanitization
- **Size Limits**: Request body size limits
- **Type Validation**: Runtime type checking

**Implementation**: `src/lib/validation.ts`

### Rate Limiting

In-memory rate limiting for API endpoints:

| Endpoint      | Limit        | Window   |
| ------------- | ------------ | -------- |
| `/api/search` | 60 requests  | 1 minute |
| `/api/vitals` | 10 requests  | 1 minute |
| General API   | 100 requests | 1 minute |

**Implementation**: `src/lib/rate-limit.ts`

### CORS

Configurable CORS headers for API routes.

**Implementation**: `src/lib/cors.ts`

---

## Performance

### Image Optimization

- **Next.js Image**: Automatic image optimization
- **Remote Patterns**: GitHub, Apple, and mzstatic image sources
- **Modern Formats**: AVIF and WebP support
- **Responsive Images**: Multiple device sizes
- **Lazy Loading**: Progressive image loading

**Configuration**: `next.config.ts`

### Caching Strategy

| Resource       | Cache Policy                                      |
| -------------- | ------------------------------------------------- |
| Static assets  | `public, max-age=31536000, immutable`             |
| API responses  | `public, s-maxage=60, stale-while-revalidate=300` |
| Images         | `public, max-age=31536000, immutable`             |
| Next.js static | `public, max-age=31536000, immutable`             |

### Code Splitting

- **Automatic Splitting**: Next.js automatic code splitting
- **Dynamic Imports**: Lazy loading for non-critical components
- **Vendor Chunking**: Separate bundle for npm packages

**Configuration**: `next.config.ts`

### Data Caching

- **File Cache Invalidation**: Based on file modification time
- **In-Memory Caching**: Search index and parsed data caching
- **Revalidation**: ISR with 1-hour revalidation

**Implementation**: `src/lib/data.ts`

---

## Accessibility

- **Semantic HTML**: Proper heading hierarchy and landmarks
- **ARIA Labels**: Screen reader support where needed
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus handling
- **Color Contrast**: WCAG AA compliant color schemes
- **Dark Mode**: System-based dark mode support

---

## Browser Support

- **Chrome**: Last 2 versions
- **Firefox**: Last 2 versions
- **Safari**: Last 2 versions
- **Edge**: Last 2 versions
- **Mobile Safari**: iOS 12+
- **Chrome Mobile**: Android 8+

---

## Development Features

### TypeScript

- **Strict Mode**: Full TypeScript strict mode enabled
- **Type Safety**: Comprehensive type definitions
- **Path Aliases**: `@/*` for `src/*`

### Hot Reload

- **Fast Refresh**: React Fast Refresh enabled
- **HMR**: Hot module replacement for styles

### Developer Tools

- **ESLint**: Code linting with TypeScript support
- **TypeScript**: Type checking
- **Vitest**: Unit testing framework
- **Playwright**: End-to-end testing framework
