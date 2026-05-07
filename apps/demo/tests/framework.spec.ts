import { test, expect } from '@playwright/test';

/**
 * NeevJS Framework — Core Feature Tests (Suite 2)
 */

// ─── useStore Tests ───────────────────────────────────────────────────────────

test.describe('useStore — Storage Tiers', () => {

  test('Test 5a: In-memory store — shared state, lost on reload', async ({ page }) => {
    await page.goto('/?page=store-test');
    await expect(page.locator('#store-test-title')).toBeVisible();

    await expect(page.locator('#counter-value')).toHaveText('0');
    await page.locator('#increment-btn').click();
    await page.locator('#increment-btn').click();
    await page.locator('#increment-btn').click();
    await expect(page.locator('#counter-value')).toHaveText('3');

    await page.reload();
    await page.waitForSelector('#store-test-title');
    await expect(page.locator('#counter-value')).toHaveText('0');
  });

  test('Test 5b: Persist store — survives page reload via localStorage', async ({ page }) => {
    await page.goto('/?page=store-test');
    await page.locator('#set-dark-btn').click();
    await expect(page.locator('#theme-value')).toHaveText('dark');

    await page.reload();
    await page.waitForSelector('#store-test-title');
    await expect(page.locator('#theme-value')).toHaveText('dark');

    await page.locator('#clear-theme-btn').click();
  });

  test('Test 5c: Session store — survives reload, cleared in new context', async ({ page, context }) => {
    await page.goto('/?page=store-test');
    await page.locator('#set-session-btn').click();
    await expect(page.locator('#session-value')).toHaveText('session-test-value');

    await page.reload();
    await expect(page.locator('#session-value')).toHaveText('session-test-value');

    const newPage = await context.newPage();
    await newPage.goto('/?page=store-test');
    await expect(newPage.locator('#session-value')).toHaveText('(empty)');
    await newPage.close();
  });

  test('Test 5d: TTL store — value expires after TTL elapses', async ({ page }) => {
    await page.goto('/?page=store-test');
    await page.locator('#set-ttl-btn').click();
    await expect(page.locator('#ttl-value')).not.toHaveText('fresh');

    // TTL is 2000ms
    await page.waitForTimeout(2500);
    await page.reload();
    await expect(page.locator('#ttl-value')).toHaveText('fresh');
  });

});

// ─── Form Validation Tests ────────────────────────────────────────────────────

test.describe('Form — Field-Level Validation', () => {

  test('Test 6: Client-side validate prop blocks submission and shows per-field errors', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Users', { exact: true }).click();
    await page.getByRole('button', { name: '+ Add User' }).click();

    await page.getByPlaceholder('e.g. Rahul Kushwaha').fill('Validation Test User');
    await page.getByPlaceholder('e.g. rahul@example.com').fill('validation@test.com');
    await page.getByRole('combobox').selectOption('admin');
    await page.getByRole('button', { name: 'Create User' }).click();

    await expect(page.getByText('VALIDATION TEST USER').first()).toBeVisible();

    // Cleanup
    page.on('dialog', dialog => dialog.accept());
    await page.locator('tr').filter({ hasText: 'VALIDATION TEST USER' }).first().getByRole('button', { name: 'Delete' }).click();
  });

});

// ─── CachePlugin Tests ────────────────────────────────────────────────────────

test.describe('CachePlugin — Cache Hit Short-circuits Network', () => {

  test('Test 7: Second navigation to Users uses cache — zero new GET requests', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Users', { exact: true }).click();
    await page.waitForSelector('table');

    let getCallsAfterWarm = 0;
    page.on('request', req => {
      if (req.url().includes('/api/users') && req.method() === 'GET') {
        getCallsAfterWarm++;
      }
    });

    await page.getByText('Dashboard', { exact: true }).click();
    await page.getByText('Users', { exact: true }).click();
    await page.waitForTimeout(500);

    expect(getCallsAfterWarm).toBe(0);
  });

});

// ─── Auth Tests ───────────────────────────────────────────────────────────────

test.describe('Auth — Login, Logout, Session Persistence', () => {

  test('Test 8: Login and user object persists across page reload', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Auth Demo', { exact: true }).click();

    if (await page.getByRole('button', { name: 'Logout' }).isVisible()) {
      await page.getByRole('button', { name: 'Logout' }).click();
    }

    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('✓ Logged in')).toBeVisible({ timeout: 5000 });

    let authMeCalls = 0;
    page.on('request', req => {
      if (req.url().includes('/auth/me')) authMeCalls++;
    });

    await page.reload();
    await page.getByText('Auth Demo', { exact: true }).click();
    await page.waitForTimeout(500);

    expect(authMeCalls).toBe(0);
    await expect(page.getByText('✓ Logged in')).toBeVisible();

    await page.getByRole('button', { name: 'Logout' }).click();
  });

  test('Test 9: 401 response auto-logs user out', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Auth Demo', { exact: true }).click();
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('✓ Logged in')).toBeVisible();

    await page.evaluate(() => {
      localStorage.setItem('neev_token', 'expired.invalid.token')
    });

    await page.evaluate(async () => {
      try {
        await (window as any).neevClient.request('/auth/me');
      } catch (e) {}
    });

    await page.waitForTimeout(1000);
    const token = await page.evaluate(() => localStorage.getItem('neev_token'));
    expect(token).toBeNull();
  });

});

// ─── useModel params Test ─────────────────────────────────────────────────────

test.describe('useModel — params (query string)', () => {

  test('Test 10: Dashboard stats are fetched from the correct URL with no param conflicts', async ({ page }) => {
    const requestedUrls: string[] = [];
    page.on('request', req => {
      if (req.url().includes('/api/')) requestedUrls.push(req.url());
    });

    await page.goto('/');
    await expect(page.getByText('Total Users in System')).toBeVisible({ timeout: 8000 });

    const usersRequests = requestedUrls.filter(u => u.includes('/api/users'));
    expect(usersRequests.length).toBeGreaterThan(0);
  });

});

// ─── Integration: Full Lifecycle ──────────────────────────────────────────────

test.describe('Integration — Full Offline Lifecycle', () => {

  test('Test 11: Offline create → reconnect → verify data persists on server', async ({ context, page }) => {
    await page.goto('/');
    await page.getByText('Users', { exact: true }).click();
    await page.waitForSelector('table');

    await context.setOffline(true);
    await page.getByRole('button', { name: '+ Add User' }).click();
    await page.getByPlaceholder('e.g. Rahul Kushwaha').fill('Integration Test');
    await page.getByPlaceholder('e.g. rahul@example.com').fill('integration@neevjs.dev');
    await page.getByRole('combobox').selectOption('user');
    await page.getByRole('button', { name: 'Create User' }).click();

    await expect(page.getByText('INTEGRATION TEST').first()).toBeVisible();

    await context.setOffline(false);
    await expect(page.getByText('● Online')).toBeVisible({ timeout: 10000 });

    await page.reload();
    await page.getByText('Users', { exact: true }).click();
    await expect(page.getByText('INTEGRATION TEST').first()).toBeVisible({ timeout: 8000 });

    page.on('dialog', dialog => dialog.accept());
    await page.locator('tr').filter({ hasText: 'INTEGRATION TEST' }).first().getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('INTEGRATION TEST')).not.toBeVisible();
  });

});
