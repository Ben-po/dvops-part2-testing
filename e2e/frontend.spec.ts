import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Authentication Frontend Tests', () => {
  test('Register new user', async ({ page, browserName }) => {
    await page.goto(`${BASE_URL}/register.html`);

    const username = `testuser-${browserName}-${Date.now()}@example.com`;
    const password = 'TestPassword123';

    // Fill registration form
    await page.fill('#register_username', username);
    await page.fill('#register_password', password);

    // Handle alert dialog
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Registered and logged in');
      await dialog.accept();
    });

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for redirect to FirstSkillSelection.html
    await page.waitForURL(`${BASE_URL}/FirstSkillSelection.html`, { timeout: 5000 });

    // Verify successful registration - check for sl_token (not token)
    const token = await page.evaluate(() => localStorage.getItem('sl_token'));
    expect(token).toBeTruthy();
    
    const loggedInUser = await page.evaluate(() => localStorage.getItem('loggedInUser'));
    expect(loggedInUser).toBe(username);
  });

  test('Login with existing user', async ({ page, browserName }) => {
    // Create unique username per browser to avoid conflicts
    const username = `logintest-${browserName}-${Date.now()}@example.com`;
    const password = 'TestPassword123';

    // Register via API to ensure it's properly saved
    const registerResponse = await page.request.post(`${BASE_URL}/api/register`, {
      data: { username, password }
    });
    
    expect(registerResponse.ok()).toBeTruthy();
    const registerData = await registerResponse.json();
    expect(registerData.success).toBe(true);

    // Wait to ensure file write completes
    await page.waitForTimeout(1000);

    // Now test the login UI
    await page.goto(`${BASE_URL}/login.html`);
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    await page.fill('#login_username', username);
    await page.fill('#login_password', password);

    // Handle alert dialog - expect success
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Logged in');
      await dialog.accept();
    });

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for redirect to home page
    await page.waitForURL(BASE_URL + '/', { timeout: 10000 });

    // Verify successful login - check for sl_token (not token)
    const token = await page.evaluate(() => localStorage.getItem('sl_token'));
    expect(token).toBeTruthy();
    
    const loggedInUser = await page.evaluate(() => localStorage.getItem('loggedInUser'));
    expect(loggedInUser).toBe(username);
  });

  test('Login should fail with incorrect password', async ({ page }) => {
    // First create a user
    await page.goto(`${BASE_URL}/register.html`);
    
    const username = `failtest-${Date.now()}@example.com`;
    const password = 'TestPassword123';
    
    await page.fill('#register_username', username);
    await page.fill('#register_password', password);
    
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/FirstSkillSelection.html`, { timeout: 5000 });

    // Now test failed login
    await page.goto(`${BASE_URL}/login.html`);

    await page.fill('#login_username', username);
    await page.fill('#login_password', 'WrongPassword');

    // Listen for alert dialogs
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Invalid');
      await dialog.accept();
    });

    // Submit the form
    await page.click('button[type="submit"]');

    await page.waitForTimeout(500);
    
    // Should still be on login page
    expect(page.url()).toBe(`${BASE_URL}/login.html`);
  });

  test('Navigation between login and register pages', async ({ page }) => {
    // Start at login page
    await page.goto(`${BASE_URL}/login.html`);
    await expect(page.locator('h2')).toHaveText('Login');

    // Click register link
    await page.click('a[href="/register.html"]');
    await expect(page.locator('h2')).toHaveText('Register');

    // Click login link
    await page.click('a[href="/login.html"]');
    await expect(page.locator('h2')).toHaveText('Login');
  });
});


