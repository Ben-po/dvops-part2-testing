import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// E2E tests focusing only on login and register flows

test.describe('Register Tests', () => {
  test('Register new user via UI', async ({ page }) => {
    const username = `e2euser-${Date.now()}@example.com`;
    const password = 'TestPassword123';

    await page.goto(`${BASE_URL}/register.html`);

    // Handle success alert so it doesn't block
    page.once('dialog', dialog => dialog.accept());

    // Fill register form (matches register.html)
    await page.fill('#register_username', username);
    await page.fill('#register_password', password);

    // Submit registration
    await page.click('#registerForm button[type="submit"]');

    // On success, frontend redirects to FirstSkillSelection.html
    await page.waitForURL(`${BASE_URL}/FirstSkillSelection.html`, {
      timeout: 10_000,
    });

    await expect(page).toHaveURL(`${BASE_URL}/FirstSkillSelection.html`);
  });
});

test.describe('Login Tests', () => {
  test('Login with valid credentials', async ({ page, request }) => {
    const username = `e2elogin-${Date.now()}@example.com`;
    const password = 'TestPassword123';

    // Ensure user exists by registering through the backend API
    const response = await request.post(`${BASE_URL}/api/register`, {
      data: { username, password },
    });

    expect(response.ok()).toBeTruthy();

    await page.goto(`${BASE_URL}/login.html`);

    // Handle success alert so it doesn't block
    page.once('dialog', dialog => dialog.accept());

    // Fill login form (matches login.html)
    await page.fill('#login_username', username);
    await page.fill('#login_password', password);

    // Submit login
    const [loginResponse] = await Promise.all([
      page.waitForResponse(resp =>
        resp.url().includes('/api/login') && resp.ok()
      ),
      page.click('#loginForm button[type="submit"]'),
    ]);

    // Ensure backend login succeeded
    expect(loginResponse.ok()).toBeTruthy();
  });
});

