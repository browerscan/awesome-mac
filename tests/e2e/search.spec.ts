import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display search input', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    await expect(searchInput.first()).toBeVisible();
  });

  test('should navigate to search page', async ({ page }) => {
    await page.click('text=Search');
    await expect(page).toHaveURL(/\/search/);
  });

  test('should search for apps', async ({ page }) => {
    await page.goto('/search');
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('code');
    await page.waitForTimeout(500); // Wait for debounced search
    const results = page.locator('text=VS Code');
    await expect(results.first()).toBeVisible();
  });
});
