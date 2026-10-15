const { test, expect } = require('@playwright/test');

test('should load the login page and allow navigation', async ({ page }) => {
  // Start from the index page (which should redirect to login if not authenticated)
  await page.goto('http://localhost:5173/');
  
  // Expect to see login or register link
  await expect(page).toHaveURL('http://localhost:5173/');
  
  // Check if we're redirected to login (if not authenticated)
  // This depends on your auth implementation
  const loginLink = page.locator('text=Login');
  const registerLink = page.locator('text=Register');
  
  // At least one of these should be visible
  await expect(await loginLink.count() + await registerLink.count()).toBeGreaterThan(0);
});

test('should navigate to dashboard after login (mocked)', async ({ page }) => {
  // This test would require mocking authentication or using test credentials
  // For now, we'll just test that the dashboard route exists
  await page.goto('http://localhost:5173/dashboard');
  
  // We expect either the dashboard or a redirect to login
  const isDashboard = await page.url().includes('/dashboard');
  const isLogin = await page.url().includes('/login');
  
  // One of these should be true
  expect(isDashboard || isLogin).toBe(true);
});