import { test, expect } from '@playwright/test';

test('Action Board opens and filters commands', async ({ page }) => {
  await page.goto('/');
  // Open via F1
  await page.keyboard.press('F1');
  const dialog = page.getByRole('dialog', { name: 'Action Board' });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole('textbox', { name: 'Action search' });
  await input.fill('Open About');
  const option = dialog.getByRole('button', { name: /Open About/ });
  await expect(option).toBeVisible();
});


