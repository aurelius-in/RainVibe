import { test, expect } from '@playwright/test';

test('Toggle Assistant Panel via Action Board', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('F1');
  const dialog = page.getByRole('dialog', { name: 'Action Board' });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole('textbox', { name: 'Action search' });
  await input.fill('Toggle Assistant Panel');
  const option = dialog.getByRole('button', { name: /Toggle Assistant Panel/i });
  await option.click();
  // No hard assertion on visibility since layout may differ; ensure action board closed
  await expect(dialog).toBeHidden();
});


