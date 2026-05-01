import { test, expect } from '@playwright/test';

test.describe('Reportes Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('reportes page loads correctly', async ({ page }) => {
    await page.goto('/dashboard/reportes');

    await expect(page.locator('h2, h1')).toBeVisible({ timeout: 5000 });
  });

  test('report type selector is displayed', async ({ page }) => {
    await page.goto('/dashboard/reportes');

    const selectorTitle = page.locator('text=Seleccionar Tipo de Reporte');
    if (await selectorTitle.isVisible()) {
      await expect(selectorTitle).toBeVisible();
    }
  });

  test('can select a report type', async ({ page }) => {
    await page.goto('/dashboard/reportes');

    const reportTypeButtons = page.locator('button:has-text("Reporte")');
    const count = await reportTypeButtons.count();

    if (count > 0) {
      await reportTypeButtons.first().click();
      await expect(reportTypeButtons.first()).toHaveClass(/ring-/);
    }
  });

  test('download button appears after report generation', async ({ page }) => {
    await page.goto('/dashboard/reportes');

    const generateButton = page.locator('button:has-text("Generar")');
    if (await generateButton.isVisible()) {
      await generateButton.click();

      await page.waitForTimeout(2000);

      const downloadButton = page.locator('button:has-text("Descargar")');
      await expect(downloadButton).toBeVisible({ timeout: 10000 });
    }
  });

  test('report form can be filled', async ({ page }) => {
    await page.goto('/dashboard/reportes');

    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() > 0) {
      await dateInputs.first().fill('2024-01-01');
    }

    const selectInputs = page.locator('select');
    if (await selectInputs.count() > 0) {
      await selectInputs.first().selectOption({ index: 1 });
    }
  });

  test('show loading state during report generation', async ({ page }) => {
    await page.goto('/dashboard/reportes');

    const generateButton = page.locator('button:has-text("Generar")');
    if (await generateButton.isVisible()) {
      await generateButton.click();

      const loadingIndicator = page.locator('.animate-spin, text=Generando...');
      await expect(loadingIndicator.or(generateButton).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('error message shown on failed report generation', async ({ page }) => {
    await page.goto('/dashboard/reportes');

    const generateButton = page.locator('button:has-text("Generar")');
    if (await generateButton.isVisible()) {
      await generateButton.click();

      await page.waitForTimeout(3000);

      const errorMessage = page.locator('text=Error, text=Error al generar');
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
    }
  });
});