import { test, expect } from '@playwright/test';

test('loads renderer and shows app root', async ({ page }) => {
  await page.goto('/');
  // Basic smoke: ensure a key UI container exists
  const appRoot = page.locator('#root');
  await expect(appRoot).toBeVisible();
});


