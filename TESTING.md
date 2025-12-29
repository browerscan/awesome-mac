# Testing Guide

This document describes the testing setup for the awesome-mac project.

## Unit Tests

Unit tests are written using **Vitest** and **React Testing Library**.

### Running Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Test Structure

```
tests/
├── setup.ts           # Test setup and mocks
├── lib/               # Library function tests
│   ├── parser.test.ts
│   ├── search.test.ts
│   └── slugify.test.ts
├── hooks/             # Custom hook tests
│   ├── useDebounce.test.ts
│   ├── useMounted.test.ts
│   └── useSearchQuery.test.ts
└── e2e/               # End-to-end tests (Playwright)
    ├── home.spec.ts
    └── search.spec.ts
```

### Writing Tests

1. **Library Functions**: Test pure functions with various inputs and edge cases
2. **Custom Hooks**: Use `renderHook` from `@testing-library/react`
3. **Components**: Use `render` from `@testing-library/react` with happy-dom

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { slugify } from '@/lib/slugify';

describe('slugify', () => {
  it('should convert to lowercase', () => {
    expect(slugify('HELLO')).toBe('hello');
  });

  it('should replace spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });
});
```

## E2E Tests

E2E tests are written using **Playwright**.

### Running E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

### E2E Test Structure

E2E tests are located in `tests/e2e/` and test the application from the user's perspective.

```typescript
import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Awesome Mac/);
  });
});
```

## Coverage

Coverage reports are generated using Vitest's built-in coverage provider (v8).

```bash
npm run test:coverage
```

Coverage reports are generated in:

- Terminal output
- `coverage/index.html` (HTML report)
- `coverage/lcov.info` (LCOV format for CI)

## Continuous Integration

Tests run automatically on:

- Every pull request
- Every push to main branch

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Use clear test names that describe what is being tested
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock External Dependencies**: Use mocks for external services
5. **Test Edge Cases**: Test boundary conditions and error cases
6. **Keep Tests Fast**: Unit tests should run quickly
