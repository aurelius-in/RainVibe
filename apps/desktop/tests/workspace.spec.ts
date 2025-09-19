import { test, expect } from '@playwright/test';

test('Workspace search input filters entries', async ({ page }) => {
  await page.goto('/');
  // Ensure Workspace tab is visible by default and search input exists
  const searchInput = page.getByRole('textbox', { name: 'Search workspace' });
  await expect(searchInput).toBeVisible();
  await searchInput.fill('README');
  // There should be at least one matching entry (README.md in repo)
  const match = page.getByText('README.md');
  await expect(match).toBeVisible();
});


