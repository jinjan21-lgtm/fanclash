import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/FanClash/);
  await expect(page.getByText('무료로 시작하기')).toBeVisible();
});

test('landing page has product features', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('후원 알림')).toBeVisible();
});
