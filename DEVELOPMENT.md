# Development Guide

This guide covers setting up and developing the Awesome Mac project, which includes both a curated markdown list and a modern Next.js web application.

## Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Data Flow](#data-flow)
- [Build Commands](#build-commands)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Project Overview

Awesome Mac consists of two main components:

### 1. Markdown-Based Content (`README.md`, `README-zh.md`)

The canonical source of content is the markdown files in the repository root. These contain the curated list of Mac applications organized by category.

### 2. Next.js Web Application (`src/`)

A modern web application built with:

- **Next.js 15** - React framework with App Router
- **PayloadCMS** - Headless CMS for admin functionality
- **next-intl** - Internationalization (English/Chinese)
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

---

## Prerequisites

- **Node.js** 18.17 or later
- **npm** 9.0 or later
- **Git** (for cloning the repository)

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/jaywcjlove/awesome-mac.git
cd awesome-mac

# Install dependencies
npm install

# (Optional) Set up environment variables
cp .env.example .env

# Generate data and start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## Development Setup

### 1. Environment Configuration

Copy the example environment file and configure as needed:

```bash
cp .env.example .env
```

Key environment variables (see [Environment Variables](#environment-variables) below):

```bash
# Database (PayloadCMS)
DATABASE_URI=file:./data/payload.db
PAYLOAD_SECRET=your-secret-key-here-min-32-chars-long

# Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA_MEASUREMENT_PROTOCOL_SECRET=your-secret-here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Installing Dependencies

Standard installation:

```bash
npm install
```

If you encounter `EPERM` cache errors:

```bash
npm --cache ./.npm-cache install
```

### 3. Data Generation

The web application reads from generated JSON files. Build the data:

```bash
npm run build:data
```

This creates:

- `dist/awesome-mac.json` - English app data
- `dist/awesome-mac.zh.json` - Chinese app data

### 4. Development Server

Start the Next.js development server with hot reload:

```bash
npm run dev
```

This automatically runs `build:data` first, then starts the server at `http://localhost:3000`.

---

## Data Flow

```
Markdown Files          Build Script              JSON Data             Next.js App
(RREADME.md)   -->   (build/ast.mjs)   -->   (dist/*.json)   -->   (Web Interface)
(README-zh.md)                            (parsed AST)
```

### Step-by-Step:

1. **Source Content**: `README.md` and `README-zh.md` contain the curated app lists with special markdown syntax for badges (Free, Open Source, App Store, Awesome List).

2. **AST Generation**: `build/ast.mjs` uses `remark` to parse the markdown into an Abstract Syntax Tree (AST). It extracts:
   - Categories (h2/h3 headings)
   - Apps (list items with links)
   - Badges (image references for free/oss/app-store/awesome-list)
   - Metadata (descriptions, URLs)

3. **JSON Output**: The AST is saved as `dist/awesome-mac.json` and `dist/awesome-mac.zh.json`.

4. **Runtime Parsing**: When the Next.js app starts, `src/lib/parser.ts` parses the JSON into structured `App` and `Category` objects.

5. **Display**: Components in `src/components/` render the data with filtering, search, and SEO.

---

## Build Commands

### Data Generation

```bash
# Generate JSON from markdown
npm run build:data
npm run create:ast  # Same as build:data
```

### Static Documentation Site

```bash
# Build idoc static site
npm run build

# Watch for changes
npm run doc
```

### Next.js Web Application

```bash
# Development (auto-runs build:data first)
npm run dev

# Production build
npm run build:web

# Production start
npm run start:web
```

### Code Quality

```bash
# Lint TypeScript/TSX files
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Type checking
npm run typecheck
```

### Testing

```bash
# Run unit tests
npm run test

# Run tests with UI
npm run test:ui

# Coverage report
npm run test:coverage

# End-to-end tests
npm run test:e2e

# E2E test UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

---

## Environment Variables

### Database Configuration

| Variable       | Description               | Default                  |
| -------------- | ------------------------- | ------------------------ |
| `DATABASE_URI` | SQLite database file path | `file:./data/payload.db` |

### PayloadCMS

| Variable         | Description                              | Required        |
| ---------------- | ---------------------------------------- | --------------- |
| `PAYLOAD_SECRET` | Secret key for encryption (min 32 chars) | Production only |

Generate with: `openssl rand -base64 32`

### API Authentication

| Variable       | Description                     |
| -------------- | ------------------------------- |
| `SYNC_API_KEY` | Key for protected sync endpoint |

### Analytics

| Variable                         | Description                         |
| -------------------------------- | ----------------------------------- |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`  | Google Analytics 4 Measurement ID   |
| `GA_MEASUREMENT_PROTOCOL_SECRET` | GA4 Measurement Protocol API Secret |
| `NEXT_PUBLIC_ANALYTICS_DEBUG`    | Enable debug mode for analytics     |

### Application

| Variable              | Description                               | Default                 |
| --------------------- | ----------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_APP_URL` | Public URL of the application             | `http://localhost:3000` |
| `NODE_ENV`            | Environment (development/production/test) | `development`           |

### SEO

| Variable                               | Description                             |
| -------------------------------------- | --------------------------------------- |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console verification code |

### Rate Limiting

| Variable                  | Description                 | Default |
| ------------------------- | --------------------------- | ------- |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window     | `60`    |
| `RATE_LIMIT_WINDOW_MS`    | Time window in milliseconds | `60000` |

### Security

| Variable                | Description                      |
| ----------------------- | -------------------------------- |
| `CORS_ALLOWED_ORIGINS`  | Comma-separated allowed origins  |
| `SECURITY_HSTS_PRELOAD` | Enable HSTS preload (production) |

---

## Project Structure

```
awesome-mac/
|- build/
|  |- ast.mjs              # Markdown parser and AST generator
|
|- dist/
|  |- awesome-mac.json     # Generated English data (git-ignored)
|  |- awesome-mac.zh.json  # Generated Chinese data (git-ignored)
|
|- messages/
|  |- en.json              # English translations
|  |- zh.json              # Chinese translations
|
|- public/
|  |- logo.svg             # Site logo
|  |- *.webmanifest        # PWA manifest
|
|- src/
|  |- app/                 # Next.js App Router pages
|  |  |- [locale]/         # Localized page routes
|  |  |- api/              # API routes
|  |  |  |- search/        # Search endpoint
|  |  |  |- vitals/        # Web Vitals endpoint
|  |  |- layout.tsx        # Root layout
|  |  |- sitemap.ts        # Dynamic sitemap
|  |  |- robots.ts         # Robots.txt
|  |
|  |- components/          # React components
|  |  |- seo/              # SEO components (JsonLd)
|  |  |- AppCard.tsx       # App listing card
|  |  |- CategoryCard.tsx  # Category card
|  |  |- Search.tsx        # Search input
|  |  |- Analytics.tsx     # Google Analytics
|  |
|  |- collections/         # PayloadCMS collections
|  |  |- Apps.ts           # Apps collection
|  |  |- Categories.ts     # Categories collection
|  |
|  |- hooks/               # React hooks
|  |  |- useDebounce.ts    # Debounce hook
|  |  |- useMounted.ts     # Mounted state hook
|  |  |- useSearchQuery.ts # Search query hook
|  |
|  |- i18n/                # Internationalization
|  |  |- routing.ts        # Locale routing config
|  |  |- request.ts        # Server request config
|  |
|  |- lib/                 # Utility libraries
|  |  |- data.ts           # Data loading functions
|  |  |- parser.ts         # AST parser
|  |  |- search/           # Search index
|  |  |- seo.ts            # SEO utilities
|  |  |- rate-limit.ts     # Rate limiting
|  |  |- validation.ts     # Input validation
|  |  |- cors.ts           # CORS headers
|  |
|  |- types/               # TypeScript types
|  |  |- index.ts          # Core types
|  |  |- api.ts            # API types
|  |
|  |- middleware.ts        # Next.js middleware (i18n, security)
|  |- payload.config.ts    # PayloadCMS configuration
|
|- .env.example            # Environment variables template
|- DEVELOPMENT.md          # This file
|- CONTRIBUTING.md         # Contributing guidelines
|- README.md               # English awesome list
|- README-zh.md            # Chinese awesome list
|- next.config.ts          # Next.js configuration
|- package.json            # Dependencies and scripts
|- tsconfig.json           # TypeScript configuration
|- tailwind.config.ts      # Tailwind CSS configuration
```

---

## Development Workflows

### Adding a New App

1. Edit `README.md` (and `README-zh.md` if bilingual)
2. Follow the format: `- [App Name](url) - Description. ![Badge][Icon]`
3. Rebuild data: `npm run build:data`
4. Refresh the browser

### Creating a New Page

1. Create a new file in `src/app/[locale]/your-page/page.tsx`
2. Use `getTranslations` for i18n
3. Add translations to `messages/en.json` and `messages/zh.json`
4. Add to sitemap if needed (see `src/app/sitemap.ts`)

### Adding a New Component

1. Create in `src/components/YourComponent.tsx`
2. Use TypeScript with proper prop types
3. Follow existing styling patterns with Tailwind classes
4. Import and use in pages or other components

### Adding API Endpoints

1. Create in `src/app/api/your-endpoint/route.ts`
2. Export `GET`, `POST`, etc. functions
3. Add security headers using `applySecurityHeaders`
4. Apply rate limiting with `rateLimiters`
5. Handle CORS with `applyCorsHeaders`

---

## Deployment

### Production Build

```bash
npm run build:web
```

This creates an optimized Next.js build in `.next/`.

### Production Start

```bash
npm run start:web
```

Or use a Node.js process manager like PM2:

```bash
pm2 start npm --name "awesome-mac" -- start
```

### Static Export (Optional)

For static hosting without a Node.js server, uncomment in `next.config.ts`:

```typescript
output: 'export',
```

Then run `npm run build:web` and deploy the `out/` directory.

---

## Troubleshooting

### "Missing dist/awesome-mac.json" Error

Run `npm run build:data` to generate the JSON files from the markdown sources.

### Port Already in Use

Kill the process on port 3000:

```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Type Errors

Run type checking to see all errors at once:

```bash
npm run typecheck
```

### Build Fails

Clear the cache and rebuild:

```bash
rm -rf .next node_modules
npm install
npm run build:web
```

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [PayloadCMS Documentation](https://payloadcms.com/docs)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Contributing Guidelines](CONTRIBUTING.md)
