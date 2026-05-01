import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('login page loads correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Iniciar Sesión');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login form has required fields', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');
    await expect(submitButton).toBeEnabled();
  });

  test('login form submission redirects to dashboard', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.url()).toContain('/dashboard');
  });

  test('register link exists on login page', async ({ page }) => {
    const registerLink = page.locator('a[href="/auth/register"]');
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toContainText('Regístrate');
  });

  test('shows validation error for invalid email format', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    const input = page.locator('input[type="email"]');
    await expect(input).toHaveAttribute('type', 'email');
  });

  test('password field is masked', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});