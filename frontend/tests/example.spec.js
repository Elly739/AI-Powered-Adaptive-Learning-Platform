import { test, expect } from '@playwright/test';

test('logs in with the seeded demo account and opens the dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('student1@university.edu');
  await page.locator('input[type="password"]').fill('password123');
  await page.getByRole('button', { name: 'Log In' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'My Courses' })).toBeVisible();
});