import { test, expect } from '@playwright/test';

test('homepage loads correctly without blocking consent on first paint', async ({ page }) => {
  await page.goto('http://localhost:5173');

  await expect(page).toHaveTitle(/Inovitaz/i);
  await expect(page.getByRole('link', { name: 'Inovitaz home' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cookie preferences' })).toHaveCount(0);
});

test('consent appears after meaningful browsing', async ({ page }) => {
  await page.goto('http://localhost:5173');

  await page.evaluate(() => window.scrollTo(0, 240));

  await expect(page.getByRole('heading', { name: 'Cookie preferences' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Decline' })).toBeVisible();
});

test('can navigate to projects page', async ({ page }) => {
  await page.goto('http://localhost:5173');

  await page.getByRole('link', { name: 'Projects' }).first().click();

  await expect(page).toHaveURL(/projects/);
});

test('signup fields have programmatic labels', async ({ page }) => {
  await page.goto('http://localhost:5173/signup');

  await expect(page.getByLabel('Full Name')).toBeVisible();
  await expect(page.getByLabel('Email Address', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Confirm Password', { exact: true })).toBeVisible();
  await expect(page.getByLabel('I agree to the Terms and Privacy Policy')).toBeVisible();
});

test('catalogue controls and FAQ accordion expose accessible state', async ({ page }) => {
  await page.goto('http://localhost:5173/projects');

  await expect(page.getByRole('searchbox', { name: 'Search projects' })).toBeVisible();
  await expect(page.getByLabel('Filter projects by category')).toBeVisible();
  await expect(page.getByLabel('Filter projects by difficulty')).toBeVisible();
  await expect(page.getByLabel('Filter projects by technology')).toBeVisible();

  await page.goto('http://localhost:5173/support');
  const question = page.getByRole('button', { name: 'What payment methods do you accept?' });
  await expect(question).toHaveAttribute('aria-expanded', 'false');
  await question.click();
  await expect(question).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('region', { name: 'What payment methods do you accept?' })).toBeVisible();
});

test('mobile navigation announces its expanded state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:5173');

  const menuButton = page.getByRole('button', { name: 'Open navigation menu' });
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  await menuButton.click();
  await expect(page.getByRole('button', { name: 'Close navigation menu' })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByLabel('Mobile navigation')).toBeVisible();
});
