import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Authentication Frontend Tests', () => {
  // Clear localStorage before each test to prevent cross-test interference
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
  });
  test('Register new user', async ({ page, browserName }) => {
    await page.goto(`${BASE_URL}/register.html`);

    const username = `testuser-${browserName}-${Date.now()}@example.com`;
    const password = 'TestPassword123';

    // Fill registration form
    await page.fill('#register_username', username);
    await page.fill('#register_password', password);

    // Handle alert dialog - set up listener before action
    const dialogPromise = page.waitForEvent('dialog');
    await page.click('button[type="submit"]');
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Registered and logged in as');
    await dialog.accept();

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

    // Register via UI first to ensure proper setup (same as Register new user test)
    await page.goto(`${BASE_URL}/register.html`);

    // Fill registration form
    await page.fill('#register_username', username);
    await page.fill('#register_password', password);

    // Handle alert dialog
    const regDialogPromise = page.waitForEvent('dialog');
    await page.click('button[type="submit"]');
    const regDialog = await regDialogPromise;
    expect(regDialog.message()).toContain('Registered and logged in as');
    await regDialog.accept();

    // Wait for redirect to FirstSkillSelection.html
    await page.waitForURL(`${BASE_URL}/FirstSkillSelection.html`, { timeout: 5000 });

    // Wait for file to be written to disk before attempting login
    await page.waitForTimeout(3000);

    // Clear auth to test login
    await page.evaluate(() => {
      localStorage.removeItem('sl_token');
      localStorage.removeItem('loggedInUser');
    });

    // Now test the login UI
    await page.goto(`${BASE_URL}/login.html`);
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    await page.fill('#login_username', username);
    await page.fill('#login_password', password);

    // Handle alert dialog - set up listener before action
    const dialogPromise = page.waitForEvent('dialog');
    await page.click('button[type="submit"]');
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Logged in as');
    await dialog.accept();

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
    
    const dialogPromise = page.waitForEvent('dialog');
    await page.click('button[type="submit"]');
    const dialog = await dialogPromise;
    await dialog.accept();
    
    await page.waitForURL(`${BASE_URL}/FirstSkillSelection.html`, { timeout: 5000 });

    // Now test failed login
    await page.goto(`${BASE_URL}/login.html`);

    await page.fill('#login_username', username);
    await page.fill('#login_password', 'WrongPassword');

    // Listen for alert dialogs - set up before action
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Invalid');
      await dialog.accept();
    });
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
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



  test('Login should fail with non-existent user', async ({ page }) => {
    await page.goto(`${BASE_URL}/login.html`);

    const nonExistentUser = `nonexistent-${Date.now()}@example.com`;
    
    await page.fill('#login_username', nonExistentUser);
    await page.fill('#login_password', 'SomePassword123');

    // Listen for alert dialogs - set up before action
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Invalid');
      await dialog.accept();
    });
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Should still be on login page
    expect(page.url()).toBe(`${BASE_URL}/login.html`);
  });





  test('Registration with special characters in credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/register.html`);

    const username = `special+user!${Date.now()}@example.com`;
    const password = 'P@ssw0rd!#$%';

    await page.fill('#register_username', username);
    await page.fill('#register_password', password);

    const dialogPromise = page.waitForEvent('dialog');
    await page.click('button[type="submit"]');
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Registered and logged in');
    await dialog.accept();

    await page.waitForURL(`${BASE_URL}/FirstSkillSelection.html`, { timeout: 5000 });

    // Verify token and user are stored
    const token = await page.evaluate(() => localStorage.getItem('sl_token'));
    expect(token).toBeTruthy();
    
    const loggedInUser = await page.evaluate(() => localStorage.getItem('loggedInUser'));
    expect(loggedInUser).toBe(username);
  });
});


