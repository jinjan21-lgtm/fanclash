import { test, expect } from '@playwright/test';

test('demo page loads without auth', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('체험')).toBeVisible();
});
