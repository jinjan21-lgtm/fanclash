import { test, expect } from '@playwright/test';

const WIDGET_TYPES = ['alert', 'ranking', 'battle', 'slots', 'gacha', 'train', 'music', 'meter'];

for (const type of WIDGET_TYPES) {
  test(`overlay demo ${type} loads`, async ({ page }) => {
    await page.goto(`/overlay/demo/${type}`);
    // Should not show error
    await expect(page.locator('.error')).not.toBeVisible();
  });
}
