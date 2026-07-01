import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Check page title
  await expect(page).toHaveTitle(/Inovitaz/i);

  // Use .first() to avoid strict mode violation
  await expect(page.getByRole('link', { name: 'Inovitaz' }).first()).toBeVisible();
});

test('can navigate to projects page', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Click the first "Projects" link (usually in navbar)
  await page.getByRole('link', { name: 'Projects' }).first().click();

  // Verify URL changed
  await expect(page).toHaveURL(/projects/);
});     