# README Improvements & Migration Guide

This document summarizes recent improvements to the Awesome Mac project and provides guidance for users and contributors migrating from the markdown-only version to the new web application.

## Table of Contents

- [Overview](#overview)
- [What is New](#what-is-new)
- [Web Application Features](#web-application-features)
- [Migration Guide for Users](#migration-guide-for-users)
- [Migration Guide for Contributors](#migration-guide-for-contributors)
- [New Pages and Routes](#new-pages-and-routes)
- [API Access](#api-access)

---

## Overview

The Awesome Mac project has evolved from a curated markdown list to a full-featured web application while maintaining the original markdown files as the canonical source of content.

### Key Principles

1. **Markdown First**: All content is still managed in `README.md` and `README-zh.md`
2. **Web Enhanced**: The web application provides search, filtering, and better navigation
3. **SEO Optimized**: Programmatic SEO pages help users discover apps
4. **Developer Friendly**: Public API for third-party integrations

---

## What is New

### Before vs After

| Feature           | Before                | After                         |
| ----------------- | --------------------- | ----------------------------- |
| Navigation        | Manual scroll/find    | Search + filters + categories |
| Discovery         | Linear list browsing  | Programmatic SEO pages        |
| App Details       | Link to external site | Dedicated app pages           |
| Mobile Experience | Basic markdown        | Responsive web app            |
| Language          | English/Chinese files | Localized UI with switcher    |
| Analytics         | None                  | Google Analytics 4            |
| API               | None                  | RESTful API                   |

### Technical Improvements

- **Next.js 15**: Modern React framework with server components
- **TypeScript**: Full type safety across the codebase
- **PayloadCMS**: Admin interface for content management
- **Tailwind CSS**: Consistent, modern styling
- **Internationalization**: Full i18n support with next-intl

---

## Web Application Features

### Search

- **Typeahead Search**: Real-time suggestions as you type
- **Smart Ranking**: Results ordered by relevance
- **Category Filtering**: Filter search results by category
- **Badge Filtering**: Filter by free, open-source, or App Store apps

### Browse

- **Category Pages**: Browse apps by category
- **Free Apps Page**: View all free applications
- **Open Source Page**: View all open-source apps
- **Best Apps Pages**: Curated best apps by category
- **Free Alternatives**: Find free alternatives to paid apps
- **Compare Pages**: Compare multiple applications side by side

### App Details

Each application now has a dedicated page with:

- Full description
- All badges (Free, Open Source, App Store, Awesome List)
- Direct links to website, GitHub, and App Store
- Related apps in the same category
- SEO-optimized metadata

---

## Migration Guide for Users

### For Readers of the Markdown List

The original markdown lists (`README.md`, `README-zh.md`) remain available and continue to be the canonical source. You can:

1. **Continue Using GitHub**: View the markdown directly on GitHub
2. **Use the Web App**: Visit the deployed web application for enhanced features
3. **Use Both**: Switch between markdown and web app as needed

### For Users of the Web Application

The web application is available at: `https://jaywcjlove.github.io/awesome-mac`

**New Workflows**:

1. **Finding Apps**: Use the search bar instead of browser find (Ctrl+F)
2. **Discovering Apps**: Browse categories or filter by badges
3. **Comparing Apps**: Use the compare pages to evaluate options
4. **Finding Alternatives**: Check the free alternatives pages for paid apps you use

---

## Migration Guide for Contributors

### Adding Apps (Still the Same)

The process for adding apps remains unchanged:

1. Edit `README.md` (and `README-zh.md` for Chinese)
2. Follow the existing format with badges
3. Submit a pull request

The web application automatically updates from the markdown.

### New Contribution Opportunities

With the web application, you can now contribute:

1. **Code Improvements**: Bug fixes, performance improvements
2. **New Features**: Search enhancements, filters, pages
3. **Translations**: Add new languages via `messages/` files
4. **Documentation**: Improve guides and documentation
5. **Design**: UI/UX improvements

### Setting Up Development

If you want to work on the web application:

```bash
# Clone your fork
git clone https://github.com/your-username/awesome-mac.git
cd awesome-mac

# Install dependencies
npm install

# Start development
npm run dev
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for more details.

---

## New Pages and Routes

### Main Pages

| Route         | Description                              |
| ------------- | ---------------------------------------- |
| `/`           | Home page with featured apps and stats   |
| `/apps`       | All apps listing with search and filters |
| `/categories` | All categories listing                   |
| `/search`     | Dedicated search page                    |

### Filter Pages

| Route          | Description          |
| -------------- | -------------------- |
| `/free`        | All free apps        |
| `/open-source` | All open-source apps |

### Dynamic Pages

| Route Pattern               | Description                 | Example                           |
| --------------------------- | --------------------------- | --------------------------------- |
| `/category/[slug]`          | Category page with all apps | `/category/developer-tools`       |
| `/apps/[slug]`              | Individual app detail page  | `/apps/visual-studio-code`        |
| `/best/[category]`          | Best apps by category       | `/best/developer-tools`           |
| `/free-alternatives/[slug]` | Free alternatives to an app | `/free-alternatives/sublime-text` |
| `/compare/[...slugs]`       | Compare multiple apps       | `/compare/vscode/sublime-text`    |

### Localized Routes

All pages support localization:

| English                     | Chinese                        |
| --------------------------- | ------------------------------ |
| `/`                         | `/zh`                          |
| `/apps`                     | `/zh/apps`                     |
| `/category/developer-tools` | `/zh/category/developer-tools` |

---

## API Access

### Search API

Search for applications programmatically:

```bash
curl "https://jaywcjlove.github.io/awesome-mac/api/search?q=vscode&limit=10"
```

Response:

```json
{
  "q": "vscode",
  "results": [
    {
      "id": "...",
      "slug": "visual-studio-code",
      "name": "Visual Studio Code",
      "description": "...",
      "categoryId": "...",
      "categoryName": "Developer Tools",
      "isFree": true,
      "isOpenSource": true,
      "isAppStore": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "hasMore": false
  },
  "suggestions": [],
  "analytics": {
    "searchId": "...",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Rate Limits

- Search API: 60 requests per minute per IP
- General API: 100 requests per minute per IP

### JavaScript Client

Use the built-in API client:

```typescript
import { api } from '@/types/api';

const results = await api.search({ q: 'vscode', limit: 10 });
console.log(results.results);
```

For full API documentation, see [API.md](API.md).

---

## Frequently Asked Questions

### Is the markdown list still being maintained?

Yes. The markdown files (`README.md`, `README-zh.md`) remain the canonical source of truth for all app listings.

### Do I need to use the web application?

No. You can continue to view and contribute to the markdown list directly on GitHub. The web application is an enhanced way to explore the content.

### How often is the web application updated?

The web application is automatically deployed when changes are pushed to the main branch. It reads directly from the markdown files via the generated JSON data.

### Can I use the API for my own project?

Yes. The API is public and can be used to build third-party applications. Please respect the rate limits.

### How do I report bugs or request features?

For bugs or feature requests related to the web application, please open an issue on GitHub and label it appropriately.

---

## Future Roadmap

Planned improvements include:

- [ ] Additional language support
- [ ] User accounts and favorites
- [ ] Advanced filtering options
- [ ] Dark mode toggle (currently system-based)
- [ ] PWA support for offline usage
- [ ] Enhanced compare functionality
- [ ] RSS feeds for new apps

---

## Additional Documentation

- [DEVELOPMENT.md](DEVELOPMENT.md) - Development setup and guide
- [FEATURES.md](FEATURES.md) - Complete feature list
- [CONTRIBUTING_CODE.md](CONTRIBUTING_CODE.md) - Code contribution guidelines
- [API.md](API.md) - API documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - General contribution guidelines
