import { test, expect } from '@playwright/test';

test.describe('Situation Monitor - SvelteKit App', () => {
	test('homepage loads correctly', async ({ page }) => {
		await page.goto('/');

		// Check page title
		await expect(page).toHaveTitle('Situation Monitor');

		// Check header is visible
		await expect(page.locator('h1')).toHaveText('Situation Monitor');

		// Check placeholder panels are rendered
		await expect(page.locator('text=Politics')).toBeVisible();
		await expect(page.locator('text=Tech')).toBeVisible();
		await expect(page.locator('text=Finance')).toBeVisible();
		await expect(page.locator('text=Markets')).toBeVisible();
	});

	test('phase indicator shows Phase 0 complete', async ({ page }) => {
		await page.goto('/');

		await expect(page.locator('text=Phase 0 Complete')).toBeVisible();
	});
});
