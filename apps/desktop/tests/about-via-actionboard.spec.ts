import { test, expect } from '@playwright/test';

test('Open About via Action Board', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('F1');
  const dialog = page.getByRole('dialog', { name: 'Action Board' });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole('textbox', { name: 'Action search' });
  await input.fill('Open About');
  await dialog.getByRole('button', { name: /Open About/ }).click();
  // Expect About modal to appear
  const aboutTitle = page.getByText('About RainVibe');
  await expect(aboutTitle).toBeVisible();
});


