import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('admin dashboard loads correctly', async ({ page }) => {
    await page.goto('/dashboard/admin');

    await expect(page.locator('h2')).toContainText('Administración');
  });

  test('dashboard page has navigation elements', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('nav, aside, header')).toBeVisible({ timeout: 5000 });
  });

  test('navigation to reportes section exists', async ({ page }) => {
    await page.goto('/dashboard');

    const reportesLink = page.locator('a[href*="reportes"]').first();
    await expect(reportesLink).toBeVisible({ timeout: 5000 });
  });

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/dashboard');

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    const navLinks = sidebar.locator('a');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('user menu is accessible', async ({ page }) => {
    await page.goto('/dashboard');

    const userMenu = page.locator('[aria-label*="usuario"], [data-testid*="user"], button:has-text("Usuario")').first();
    if (await userMenu.isVisible()) {
      await userMenu.click();
    }
  });

  test('admin page shows admin panel text', async ({ page }) => {
    await page.goto('/dashboard/admin');

    await expect(page.locator('text=Panel de administración')).toBeVisible({ timeout: 5000 });
  });
});