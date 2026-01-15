import { test, expect } from '@playwright/test';

test.describe('Situation Monitor - Legacy App', () => {
	test('legacy app loads correctly', async ({ page }) => {
		await page.goto('/legacy.html');

		// Check page title
		await expect(page).toHaveTitle('Situation Monitor');

		// Check header is visible
		await expect(page.locator('h1.title')).toHaveText('Situation Monitor');

		// Check status element exists
		await expect(page.locator('#status')).toBeVisible();

		// Check panels exist
		await expect(page.locator('[data-panel="politics"]')).toBeVisible();
		await expect(page.locator('[data-panel="tech"]')).toBeVisible();
		await expect(page.locator('[data-panel="finance"]')).toBeVisible();
	});

	test('legacy app can refresh', async ({ page }) => {
		await page.goto('/legacy.html');

		// Wait for initial load
		await page.waitForSelector('#status');

		// The refresh button should exist
		await expect(page.locator('#refreshBtn')).toBeVisible();
	});
});
