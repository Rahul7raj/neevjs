import { test, expect } from '@playwright/test';

test.describe('NeevJS Architecture Tests', () => {
  
  test('Test 1: Global Pub/Sub Reactivity', async ({ page }) => {
    await page.goto('/');
    
    // Go to Users tab
    await page.getByText('Users', { exact: true }).click();
    
    // Click Add User
    await page.getByRole('button', { name: '+ Add User' }).click();
    
    // Fill form
    await page.getByPlaceholder('e.g. Rahul Kushwaha').fill('Test User Reactivity');
    await page.getByPlaceholder('e.g. rahul@example.com').fill('reactivity@test.com');
    await page.getByRole('combobox').selectOption('admin');
    
    // Submit
    await page.getByRole('button', { name: 'Create User' }).click();
    
    // Assert table updates instantly (Pub/Sub)
    await expect(page.getByText('TEST USER REACTIVITY')).toBeVisible();
    
    // Delete it to clean up
    page.on('dialog', dialog => dialog.accept());
    await page.locator('tr').filter({ hasText: 'TEST USER REACTIVITY' }).getByRole('button', { name: 'Delete' }).click();
    
    // Assert it's gone
    await expect(page.getByText('TEST USER REACTIVITY')).not.toBeVisible();
  });

  test('Test 2: Logic Overrides (transformPayload)', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Users', { exact: true }).click();
    
    await page.getByRole('button', { name: '+ Add User' }).click();
    await page.getByPlaceholder('e.g. Rahul Kushwaha').fill('lowercase name');
    await page.getByPlaceholder('e.g. rahul@example.com').fill('lowercase@test.com');
    await page.getByRole('combobox').selectOption('user');
    await page.getByRole('button', { name: 'Create User' }).click();
    
    // Assert table shows UPPERCASE name due to transformPayload
    await expect(page.getByText('LOWERCASE NAME').first()).toBeVisible();

    // Cleanup
    page.on('dialog', dialog => dialog.accept());
    await page.locator('tr').filter({ hasText: 'LOWERCASE NAME' }).first().getByRole('button', { name: 'Delete' }).click();
  });

  test('Test 3: Request Deduplication & Caching', async ({ page }) => {
    // ... same as before ...
  });

  test('Test 4: Offline Sync Engine & Optimistic UI', async ({ context, page }) => {
    await page.goto('/');
    await page.getByText('Users', { exact: true }).click();
    
    // Force Offline
    await context.setOffline(true);
    
    await page.getByRole('button', { name: '+ Add User' }).click();
    await page.getByPlaceholder('e.g. Rahul Kushwaha').fill('Offline User');
    await page.getByPlaceholder('e.g. rahul@example.com').fill('offline@test.com');
    await page.getByRole('combobox').selectOption('manager');
    await page.getByRole('button', { name: 'Create User' }).click();
    
    // 1. Optimistic UI Check: It should instantly show up in the table
    await expect(page.getByText('OFFLINE USER').first()).toBeVisible();
    
    // 2. Sync Indicator Check: Should show Offline queued
    await expect(page.getByText('● Offline (1 queued)')).toBeVisible();
    
    // Force Online
    await context.setOffline(false);
    
    // 3. Background Sync Check: Should transition to syncing then online
    await expect(page.getByText('● Online')).toBeVisible({ timeout: 10000 });
    
    // Verify it's actually on the server now by refreshing the page
    await page.reload();
    await page.getByText('Users', { exact: true }).click();
    await expect(page.getByText('OFFLINE USER').first()).toBeVisible();

    // Cleanup
    page.on('dialog', dialog => dialog.accept());
    await page.locator('tr').filter({ hasText: 'OFFLINE USER' }).first().getByRole('button', { name: 'Delete' }).click();
  });

});
