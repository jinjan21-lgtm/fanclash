import { test, expect } from '@playwright/test';

test('login page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('로그인')).toBeVisible();
});

test('signup page loads', async ({ page }) => {
  await page.goto('/signup');
  await expect(page.getByText('회원가입')).toBeVisible();
});

test('dashboard redirects to login when not authenticated', async ({ page }) => {
  await page.goto('/dashboard');
  // Should redirect to login
  await expect(page).toHaveURL(/login/);
});
