import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Awesome Mac/);
  });

  test('should display hero section', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('section').first();
    await expect(hero).toContainText('Discover');
    await expect(hero).toContainText('Awesome');
    await expect(hero).toContainText('Mac Apps');
  });

  test('should display stats', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Total Apps')).toBeVisible();
    await expect(page.locator('text=Open Source')).toBeVisible();
    await expect(page.locator('text=Free Apps')).toBeVisible();
    await expect(page.locator('text=Categories')).toBeVisible();
  });

  test('should display categories section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Browse by Category')).toBeVisible();
  });

  test('should have category cards', async ({ page }) => {
    await page.goto('/');
    const categoryCards = page.locator('a[href^="/category/"]');
    await expect(categoryCards.first()).toBeVisible();
  });

  test('should display featured apps section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Featured Open Source Apps')).toBeVisible();
  });

  test('should have app cards', async ({ page }) => {
    await page.goto('/');
    const appCards = page.locator('a[href^="/apps/"]');
    await expect(appCards.first()).toBeVisible();
  });

  test('should have CTA section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Contribute to Awesome Mac')).toBeVisible();
    await expect(page.locator('a[href="https://github.com/jaywcjlove/awesome-mac"]')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Categories');
    await expect(page).toHaveURL(/\/categories/);
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 375, height: 667 });
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
  });
});
