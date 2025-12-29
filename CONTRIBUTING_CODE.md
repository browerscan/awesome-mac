# Contributing Code

This guide covers technical contribution guidelines for the Awesome Mac web application.

For general contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).
For development setup, see [DEVELOPMENT.md](DEVELOPMENT.md).

## Table of Contents

- [Getting Started](#getting-started)
- [Code Style Guide](#code-style-guide)
- [Component Architecture](#component-architecture)
- [Adding Features](#adding-features)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)

---

## Getting Started

### Prerequisites

Before contributing code, ensure you have:

1. Read the [Development Guide](DEVELOPMENT.md)
2. Set up your local development environment
3. Familiarity with TypeScript, React, and Next.js

### Initial Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/awesome-mac.git
cd awesome-mac

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start development
npm run dev
```

---

## Code Style Guide

### TypeScript

- **Strict Mode**: The project uses TypeScript strict mode
- **No `any`**: Avoid using `any` type
- **Explicit Returns**: Always specify return types for exported functions
- **Interface for Shapes**: Use `interface` for object shapes, `type` for unions/intersections

```typescript
// Good
export interface App {
  id: string;
  name: string;
  description: string;
}

export async function getApp(id: string): Promise<App | undefined> {
  // ...
}

// Bad
export async function getApp(id: any): any {
  // ...
}
```

### React Components

- **Functional Components**: Use functional components with hooks
- **Props Interface**: Define props interface explicitly
- **Default Exports**: Use default exports for pages, named exports for components

```typescript
// src/components/MyComponent.tsx
export interface MyComponentProps {
  title: string;
  count?: number;
  onAction?: () => void;
}

export function MyComponent({ title, count = 0, onAction }: MyComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
      <span>Count: {count}</span>
    </div>
  );
}
```

### Naming Conventions

| Type       | Convention                               | Example                          |
| ---------- | ---------------------------------------- | -------------------------------- |
| Components | PascalCase                               | `AppCard.tsx`, `Search.tsx`      |
| Functions  | camelCase                                | `getData()`, `formatDate()`      |
| Constants  | UPPER_SNAKE_CASE                         | `MAX_RESULTS`, `DEFAULT_TIMEOUT` |
| Interfaces | PascalCase                               | `SearchResult`, `ApiResponse`    |
| Types      | PascalCase                               | `AppStatus`, `FilterCriteria`    |
| Files      | camelCase (lib), PascalCase (components) | `useSearch.ts`, `AppCard.tsx`    |

### File Organization

- **Components**: `src/components/ComponentName.tsx`
- **Hooks**: `src/hooks/useHookName.ts`
- **Utilities**: `src/lib/utilityName.ts`
- **Types**: `src/types/` or co-located with component
- **Styles**: Use Tailwind classes (no separate CSS files)

### Import Order

```typescript
// 1. React imports
import { useState, useEffect } from 'react';

// 2. Third-party imports
import { NextResponse } from 'next/server';
import clsx from 'clsx';

// 3. Alias imports (@/*)
import { Button } from '@/components/Button';
import { getData } from '@/lib/data';
import type { App } from '@/types';

// 4. Relative imports
import { localHelper } from './utils';
```

---

## Component Architecture

### Component Structure

```typescript
// src/components/ExampleComponent.tsx
import type { ExampleComponentProps } from './types';

export function ExampleComponent({ prop1, prop2 }: ExampleComponentProps) {
  // 1. Hooks (useState, useEffect, custom hooks)
  const [state, setState] = useState(null);

  // 2. Derived values
  const derived = useMemo(() => compute(state), [state]);

  // 3. Event handlers
  const handleClick = useCallback(() => {
    setState(newValue);
  }, []);

  // 4. Effects
  useEffect(() => {
    // Side effects here
  }, []);

  // 5. Render helpers (if needed)
  const renderItem = (item: Item) => <div>{item.name}</div>;

  // 6. Conditional early returns
  if (isLoading) return <Skeleton />;

  // 7. Main render
  return (
    <div className="...">
      {items.map(renderItem)}
    </div>
  );
}
```

### Server vs Client Components

Use the `'use client'` directive only when needed:

- **Server Components (default)**: Data fetching, static content
- **Client Components**: Interactivity, hooks, browser APIs

```typescript
// Server component (no directive needed)
export async function ServerComponent() {
  const data = await getData();
  return <div>{data.name}</div>;
}

// Client component
'use client';

import { useState } from 'react';

export function ClientComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Data Fetching

For server components, fetch data directly:

```typescript
import { getAllApps } from '@/lib/data';

export default async function AppsPage() {
  const apps = await getAllApps();
  return <AppList apps={apps} />;
}
```

For client components, use Server Actions or API routes:

```typescript
'use client';

import { useEffect, useState } from 'react';
import type { App } from '@/types';

export function useApps() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/apps')
      .then((res) => res.json())
      .then((data) => setApps(data))
      .finally(() => setLoading(false));
  }, []);

  return { apps, loading };
}
```

---

## Adding Features

### Adding a New Page

1. Create the page file in `src/app/[locale]/your-page/page.tsx`

```typescript
// src/app/[locale]/your-page/page.tsx
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'yourPage' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function YourPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'yourPage' });

  return (
    <main>
      <h1>{t('title')}</h1>
    </main>
  );
}
```

2. Add translations to `messages/en.json` and `messages/zh.json`:

```json
{
  "yourPage": {
    "title": "Your Page",
    "description": "Page description"
  }
}
```

3. Add to sitemap if needed in `src/app/sitemap.ts`

### Adding a New Component

1. Create component in `src/components/YourComponent.tsx`

2. Follow the component structure above

3. Export from `src/components/index.ts` if used widely

### Adding a New Hook

```typescript
// src/hooks/useYourHook.ts
import { useState, useCallback } from 'react';

export interface UseYourHookResult {
  value: string;
  update: (newValue: string) => void;
}

export function useYourHook(initialValue: string): UseYourHookResult {
  const [value, setValue] = useState(initialValue);

  const update = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  return { value, update };
}
```

### Adding API Endpoints

```typescript
// src/app/api/your-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { applyCorsHeaders, applySecurityHeaders } from '@/lib';
import { rateLimiters, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Apply security headers
  const response = NextResponse.json({ data: 'value' });
  applyCorsHeaders(req, response);
  applySecurityHeaders(response);

  // Check rate limits
  const clientId = getClientIp(req);
  const rateLimitResult = await rateLimiters.api.check(clientId);

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  // Your logic here
  return response;
}
```

---

## Testing Guidelines

### Unit Tests

Create tests alongside components using Vitest:

```typescript
// src/components/__tests__/AppCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AppCard } from '../AppCard';

describe('AppCard', () => {
  it('renders app name', () => {
    const mockApp = {
      id: '1',
      name: 'Test App',
      description: 'Test description',
      // ... other props
    };
    render(<AppCard app={mockApp} />);
    expect(screen.getByText('Test App')).toBeInTheDocument();
  });
});
```

### End-to-End Tests

Create E2E tests using Playwright:

```typescript
// tests/e2e/search.spec.ts
import { test, expect } from '@playwright/test';

test('search returns results', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[type="search"]', 'vscode');
  await page.press('input[type="search"]', 'Enter');
  await expect(page.getByText('Visual Studio Code')).toBeVisible();
});
```

### Running Tests

```bash
# Unit tests
npm run test

# Unit tests with UI
npm run test:ui

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E with UI
npm run test:e2e:ui
```

---

## Pull Request Process

### Before Submitting

1. **Run Type Check**: `npm run typecheck`
2. **Run Linter**: `npm run lint:fix`
3. **Run Tests**: `npm run test`
4. **Build Successfully**: `npm run build:web`

### PR Description Template

```markdown
## Description

Brief description of changes.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)

[Add screenshots for UI changes]

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added to complex code
- [ ] Documentation updated
- [ ] No new warnings generated
```

### Code Review Guidelines

- **Be Constructive**: Focus on improving code quality
- **Explain Issues**: Provide context for suggested changes
- **Approve Promptly**: Review PRs within 48 hours

---

## Common Patterns

### Internationalization

```typescript
import { getTranslations } from 'next-intl/server';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pageName' });

  return <h1>{t('title')}</h1>;
}
```

### Error Handling

```typescript
import { notFound } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = await getAppBySlug(slug);

  if (!app) {
    notFound();
  }

  return <AppDetail app={app} />;
}
```

### Loading States

```typescript
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<AppListSkeleton />}>
      <AppList />
    </Suspense>
  );
}
```

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
