import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

/* =========================================================
   Authentication – Frontend Tests
   ========================================================= */

test.describe('Authentication Frontend Tests', () => {
  test('Register user', async ({ page, browserName }) => {
    await page.goto(`${BASE_URL}/register.html`);

    const username = `testuser-${browserName}-${Date.now()}@example.com`;
    const password = 'TestPassword123';

    await page.fill('#register_username', username);
    await page.fill('#register_password', password);

    // This flow DOES show alert in your app
    const dialogPromise = page.waitForEvent('dialog');
    await page.click('button[type="submit"]');
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Registered and logged in');
    await dialog.accept();

    await page.waitForURL(`${BASE_URL}/FirstSkillSelection.html`);

    expect(await page.evaluate(() => localStorage.getItem('sl_token'))).toBeTruthy();
    expect(await page.evaluate(() => localStorage.getItem('loggedInUser'))).toBe(username);
  });

 test('Login user', async ({ page, browserName }) => {
  const username = `logintest-${browserName}-${Date.now()}@example.com`;
  const password = 'TestPassword123';

  // Register via API
  const res = await page.request.post(`${BASE_URL}/api/register`, {
    data: { username, password },
  });
  expect(res.ok()).toBeTruthy();

  // 🔑 WAIT until backend can authenticate the user
  await expect(async () => {
    const loginCheck = await page.request.post(`${BASE_URL}/api/login`, {
      data: { username, password },
    });
    expect(loginCheck.ok()).toBeTruthy();
  }).toPass({ timeout: 3000 });

  // Now test the UI
  await page.goto(`${BASE_URL}/login.html`);
  await page.fill('#login_username', username);
  await page.fill('#login_password', password);

  const dialogPromise = page.waitForEvent('dialog');
  await page.click('button[type="submit"]');

  const dialog = await dialogPromise;
  expect(dialog.message()).toContain('Logged in');
  await dialog.accept();

  await page.waitForURL(`${BASE_URL}/`);
});


  test('Login should fail with incorrect password', async ({ page }) => {
    await page.goto(`${BASE_URL}/register.html`);

    const username = `failtest-${Date.now()}@example.com`;
    await page.fill('#register_username', username);
    await page.fill('#register_password', 'TestPassword123');

    const regDialog = page.waitForEvent('dialog');
    await page.click('button[type="submit"]');
    await (await regDialog).accept();

    await page.waitForURL(`${BASE_URL}/FirstSkillSelection.html`);

    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('#login_username', username);
    await page.fill('#login_password', 'WrongPassword');

    // No alert here → stay on login page
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(`${BASE_URL}/login.html`);
  });

  test('Navigation between login and register pages', async ({ page }) => {
    await page.goto(`${BASE_URL}/login.html`);
    await expect(page.locator('h2')).toHaveText('Login');

    await page.click('a[href="/register.html"]');
    await expect(page.locator('h2')).toHaveText('Register');

    await page.click('a[href="/login.html"]');
    await expect(page.locator('h2')).toHaveText('Login');
  });
});

/* =========================================================
   Home & Logout Behaviour
   ========================================================= */

test.describe('Home and logout behavior', () => {
  test('Home shows logged out when no token', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    await expect(page.locator('#loginBtn')).toBeVisible();
    await expect(page.locator('#registerBtn')).toBeVisible();
    await expect(page.locator('#logoutBtn')).toBeHidden();
  });

  test('Logout clears token and updates nav', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    await page.evaluate(() => {
      window.showLoggedIn({ username: 'logout-user' });
      window.saveToken('dummy-token');
      localStorage.setItem('loggedInUser', 'logout-user');
    });

    await page.click('#logoutBtn');

    expect(await page.evaluate(() => localStorage.getItem('sl_token'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('loggedInUser'))).toBeNull();

    await expect(page.locator('#loginBtn')).toBeVisible();
    await expect(page.locator('#logoutBtn')).toBeHidden();
  });
});

/* =========================================================
   Auth Validation & Error Handling
   ========================================================= */

test.describe('Auth validation and error handling', () => {
  test('Login requires username and password', async ({ page }) => {
    await page.goto(`${BASE_URL}/login.html`);

    await page.fill('#login_username', 'someuser@example.com');
    await page.click('#loginForm button[type="submit"]');

    // No alert → validation prevents submission
    await expect(page).toHaveURL(`${BASE_URL}/login.html`);
  });

  test('Register requires username and password', async ({ page }) => {
    await page.goto(`${BASE_URL}/register.html`);

    await page.fill('#register_username', 'someuser@example.com');
    await page.click('#registerForm button[type="submit"]');

    await expect(page).toHaveURL(`${BASE_URL}/register.html`);
  });

  test('Register duplicate user shows backend rejection', async ({ page, browserName }) => {
    const username = `dup-${browserName}-${Date.now()}@example.com`;
    const password = 'TestPassword123';

    const first = await page.request.post(`${BASE_URL}/api/register`, {
      data: { username, password },
    });
    expect(first.ok()).toBeTruthy();

    await page.goto(`${BASE_URL}/register.html`);
    await page.fill('#register_username', username);
    await page.fill('#register_password', password);
    await page.click('#registerForm button[type="submit"]');

    // Duplicate → no redirect
    await expect(page).toHaveURL(`${BASE_URL}/register.html`);
  });

  test('Login network error prevents login', async ({ page }) => {
    await page.goto(`${BASE_URL}/login.html`);

    await page.evaluate(() => {
      window.fetch = () => Promise.reject(new Error('forced network error'));
    });

    await page.fill('#login_username', 'any@example.com');
    await page.fill('#login_password', 'password');
    await page.click('#loginForm button[type="submit"]');

    await expect(page).toHaveURL(`${BASE_URL}/login.html`);
  });

  test('Register network error prevents registration', async ({ page }) => {
    await page.goto(`${BASE_URL}/register.html`);

    await page.evaluate(() => {
      window.fetch = () => Promise.reject(new Error('forced network error'));
    });

    await page.fill('#register_username', 'any@example.com');
    await page.fill('#register_password', 'password');
    await page.click('#registerForm button[type="submit"]');

    await expect(page).toHaveURL(`${BASE_URL}/register.html`);
  });
});

/* =========================================================
   Skill Selection Behaviour
   ========================================================= */

test.describe('Skill selection behavior', () => {
  test('Skill submit with zero skills shows alert', async ({ page }) => {
    await page.goto(`${BASE_URL}/FirstSkillSelection.html`);
    await page.waitForSelector('#submitSkillsBtn');

    // Ensure handlers exist
    await page.waitForFunction(() => typeof setupSkillSelection === 'function');

    const submitBtn = page.locator('#submitSkillsBtn');
    await expect(submitBtn).toBeDisabled();

    // ✅ Attach dialog handler BEFORE triggering click (prevents Chromium race)
    const dialogPromise = new Promise<string>((resolve) => {
      page.once('dialog', async (dialog) => {
        resolve(dialog.message());
        await dialog.accept();
      });
    });

    await page.evaluate(() => {
      const btn = document.querySelector('#submitSkillsBtn') as HTMLButtonElement | null;
      if (btn) {
        btn.disabled = false;
        btn.dispatchEvent(
          new MouseEvent('click', { bubbles: true, cancelable: true })
        );
      }
    });

    const message = await dialogPromise;
    expect(message).toContain('Please select at least one skill.');

    await expect(page).toHaveURL(`${BASE_URL}/FirstSkillSelection.html`);
  });

});

/* =========================================================
   Show logged in
   ========================================================= */

test.describe('Show logged in behavior', () => {
  test('showLoggedIn updates navbar state', async ({ page }) => {
  await page.goto(`${BASE_URL}/`);

  await page.evaluate(() => {
    showLoggedIn({ username: 'coverage-user' });
  });

  await expect(page.locator('#logoutBtn')).toBeVisible();
  await expect(page.locator('#loginBtn')).toBeHidden();
  await expect(page.locator('#registerBtn')).toBeHidden();
  });

});

/* =========================================================
   Show logged out
   ========================================================= */
test.describe('Show logged out behavior', () => {
  test('token helpers save and clear token', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    await page.evaluate(() => {
      saveToken('dummy-token');
    });

    const token = await page.evaluate(() => localStorage.getItem('sl_token'));
    expect(token).toBe('dummy-token');

    await page.evaluate(() => {
      clearToken();
    });

    const cleared = await page.evaluate(() => localStorage.getItem('sl_token'));
    expect(cleared).toBeNull();
  });

});

/* =========================================================
   COver token helpers
   ========================================================= */
test.describe('Token helper functions', () => {
  test('token helpers save and clear token', async ({ page }) => {
  await page.goto(`${BASE_URL}/`);

  await page.evaluate(() => {
    saveToken('dummy-token');
  });

  const token = await page.evaluate(() => localStorage.getItem('sl_token'));
  expect(token).toBe('dummy-token');

  await page.evaluate(() => {
    clearToken();
  });

  const cleared = await page.evaluate(() => localStorage.getItem('sl_token'));
  expect(cleared).toBeNull();
  });

});

   /* =========================================================
   Cover already logged in
   ========================================================= */

test.describe('Already logged in behavior', () => {
  test('Home page does NOT auto-login with token only', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    await page.evaluate(() => {
      localStorage.setItem('sl_token', 'existing-token');
      localStorage.setItem('loggedInUser', 'existing-user');
    });

    await page.reload();

    // UI should still be logged out
    await expect(page.locator('#logoutBtn')).toBeHidden();
    await expect(page.locator('#loginBtn')).toBeVisible();
    await expect(page.locator('#registerBtn')).toBeVisible();
  });

});

  /* =========================================================
   Login Success
   ========================================================= */

test.describe('Login success behavior', () => {
  test('Login success executes success branch', async ({ page }) => {
    const username = `cov-login-${Date.now()}@example.com`;
    const password = 'Password123';

    // Register first (API is fine for setup)
    await page.request.post(`${BASE_URL}/api/register`, {
      data: { username, password },
    });

    await page.goto(`${BASE_URL}/login.html`);

    await page.fill('#login_username', username);
    await page.fill('#login_password', password);

    const dialogPromise = new Promise<string>((resolve) => {
      page.once('dialog', async dialog => {
        resolve(dialog.message());
        await dialog.accept();
      });
    });

    await page.click('#loginForm button[type="submit"]');

    const message = await dialogPromise;
    expect(message).toContain('Logged in as');

    await page.waitForURL(`${BASE_URL}/`);
  });
});


/* =========================================================
   Register Success
   ========================================================= */

test.describe('Register success behavior', () => {
  test('Register success executes success branch', async ({ page }) => {
    const username = `cov-reg-${Date.now()}@example.com`;
    const password = 'Password123';

    await page.goto(`${BASE_URL}/register.html`);

    await page.fill('#register_username', username);
    await page.fill('#register_password', password);

    const dialogPromise = new Promise<string>((resolve) => {
      page.once('dialog', async dialog => {
        resolve(dialog.message());
        await dialog.accept();
      });
    });

    await page.click('#registerForm button[type="submit"]');

    const message = await dialogPromise;
    expect(message).toContain('Registered and logged in');

    await page.waitForURL(`${BASE_URL}/FirstSkillSelection.html`);
  });
});

/* =========================================================
   Skill Submit Success
   ========================================================= */

test.describe('Skill submit success behavior', () => {
  test('Skill submit executes success branch', async ({ page }) => {
    await page.goto(`${BASE_URL}/FirstSkillSelection.html`);
    await page.waitForSelector('.skill-card');

    const cards = page.locator('.skill-card');
    const submitBtn = page.locator('#submitSkillsBtn');

    await cards.nth(0).click();
    await cards.nth(1).click();

    const dialogPromise = new Promise<string>((resolve) => {
      page.once('dialog', async dialog => {
        resolve(dialog.message());
        await dialog.accept();
      });
    });

    await submitBtn.click();

    const message = await dialogPromise;
    expect(message).toContain('You have selected');

    await page.waitForURL(`${BASE_URL}/`);
  });
});
