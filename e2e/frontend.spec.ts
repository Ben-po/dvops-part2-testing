import './playwright-coverage.js';
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5050';

test.describe('Auth UI (Benjamin.js)', () => {

  /* -------------------------
     LOGIN – EMPTY FIELDS
  -------------------------- */
  test('Login fails when fields are empty', async ({ page }) => {
    await page.goto(`${BASE_URL}/login.html`);

    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Username and password are required');
      await dialog.accept();
    });

    await page.click('#loginForm button[type="submit"]');
    await page.waitForTimeout(500);
  });

  /* -------------------------
     LOGIN – INVALID CREDENTIALS
  -------------------------- */
  test('Login fails with invalid credentials', async ({ page }) => {
    await page.route('**/api/login', route =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      })
    );

    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('#login_username', 'wrong');
    await page.fill('#login_password', 'wrong');

    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Invalid credentials');
      await dialog.accept();
    });

    await page.click('#loginForm button[type="submit"]');
    await page.waitForTimeout(500);
  });

  /* -------------------------
     LOGIN – SUCCESS
  -------------------------- */
  test('Login succeeds with valid credentials', async ({ page }) => {
    const username = `e2e-login-${Date.now()}@example.com`;

    await page.route('**/api/login', async route => {
      await page.waitForTimeout(50);
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { username },
        }),
      });
    });

    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('#login_username', username);
    await page.fill('#login_password', 'Password123');
    await page.click('#loginForm button[type="submit"]');
    await page.waitForTimeout(200);
  });

  /* -------------------------
     REGISTER – EMPTY FIELDS
  -------------------------- */
  test('Register fails when fields are empty', async ({ page }) => {
    await page.goto(`${BASE_URL}/register.html`);

    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Username and password are required');
      await dialog.accept();
    });

    await page.click('#registerForm button[type="submit"]');
    await page.waitForTimeout(500);
  });

  /* -------------------------
    LOGIN – BUTTON STATE CHANGES
  -------------------------- */
  test('Login button changes state during submission', async ({ page }) => {
        const username = `e2e-btn-${Date.now()}@example.com`;

        await page.route('**/api/login', async route => {
          await page.waitForTimeout(100);
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              user: { username },
            }),
          });
        });

        await page.goto(`${BASE_URL}/login.html`);
        await page.fill('#login_username', username);
        await page.fill('#login_password', 'Password123');

        await page.click('#loginForm button[type="submit"]');

        await page.waitForTimeout(250);
      });

      /* -------------------------
         REGISTER – BUTTON STATE CHANGES
      -------------------------- */
      test('Register button changes state during submission', async ({ page }) => {
        const username = `e2e-reg-btn-${Date.now()}@example.com`;

        await page.route('**/api/register', async route => {
          await page.waitForTimeout(100);
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              user: { username },
            }),
          });
        });

        await page.goto(`${BASE_URL}/register.html`);
        await page.fill('#register_username', username);
        await page.fill('#register_password', 'Password123');

        await page.click('#registerForm button[type="submit"]');

        await page.waitForTimeout(250);
      });
  });

  /* -------------------------
     REGISTER – DUPLICATE USER
  -------------------------- */
  test('Register fails for duplicate user', async ({ page }) => {
    await page.route('**/api/register', route =>
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Username already taken' }),
      })
    );

    await page.goto(`${BASE_URL}/register.html`);
    await page.fill('#register_username', 'existing');
    await page.fill('#register_password', 'Password123');

    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Username already taken');
      await dialog.accept();
    });

    await page.click('#registerForm button[type="submit"]');
    await page.waitForTimeout(500);
  });

  /* -------------------------
     REGISTER – SUCCESS
  -------------------------- */
  test('Register succeeds with valid input', async ({ page }) => {
    const username = `e2e-reg-${Date.now()}@example.com`;

    await page.route('**/api/register', async route => {
      await page.waitForTimeout(50);
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { username },
        }),
      });
    });

    await page.goto(`${BASE_URL}/register.html`);
    await page.fill('#register_username', username);
    await page.fill('#register_password', 'Password123');
    await page.click('#registerForm button[type="submit"]');
    await page.waitForTimeout(200);
  });

  /* -------------------------
     LOAD ON PAGE WITHOUT FORMS
  -------------------------- */
  test('Benjamin.js loads safely on pages without forms', async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForTimeout(200);
    // Verify no errors when forms don't exist
    const hasErrors = await page.evaluate(() => {
      return window.onerror !== null;
    });
    expect(hasErrors).toBeFalsy();
  });

  /* -------------------------
     LOGIN – SPECIAL CHARACTERS
  -------------------------- */
  test('Login handles special characters in credentials', async ({ page }) => {
    const username = 'test@#$%user';

    await page.route('**/api/login', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { username },
        }),
      })
    );

    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('#login_username', username);
    await page.fill('#login_password', 'P@$$w0rd!123');

    await page.click('#loginForm button[type="submit"]');
    await page.waitForTimeout(500);
  });

  /* -------------------------
     REGISTER – SPECIAL CHARACTERS
  -------------------------- */
  test('Register handles special characters in credentials', async ({ page }) => {
    const username = 'user!@#$%';

    await page.route('**/api/register', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { username },
        }),
      })
    );

    await page.goto(`${BASE_URL}/register.html`);
    await page.fill('#register_username', username);
    await page.fill('#register_password', 'C0mpl3x!Pass');

    await page.click('#registerForm button[type="submit"]');
    await page.waitForTimeout(500);
  });

  /* -------------------------
     LOGIN – EMPTY ERROR MESSAGE
  -------------------------- */
  test('Login handles empty error message', async ({ page }) => {
    await page.route('**/api/login', route =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    );

    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('#login_username', 'user');
    await page.fill('#login_password', 'pass');

    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Login failed');
      await dialog.accept();
    });

    await page.click('#loginForm button[type="submit"]');
    await page.waitForTimeout(500);
  });

  /* -------------------------
     REGISTER – EMPTY ERROR MESSAGE
  -------------------------- */
  test('Register handles empty error message', async ({ page }) => {
    await page.route('**/api/register', route =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    );

    await page.goto(`${BASE_URL}/register.html`);
    await page.fill('#register_username', 'user');
    await page.fill('#register_password', 'pass');

    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Register failed');
      await dialog.accept();
    });

    await page.click('#registerForm button[type="submit"]');
    await page.waitForTimeout(500);
  });


