import { expect, test, type BrowserContext } from '@playwright/test';
import { encode } from '@auth/core/jwt';
import { randomUUID } from 'node:crypto';

const origin = 'http://localhost:4187';
const headers = { Origin: origin };
async function authenticate(context: BrowserContext, id = randomUUID()) {
	const token = await encode({
		secret: 'e2e-test-session-secret-not-for-production-12345',
		salt: 'authjs.session-token',
		token: { sub: `google:${id}`, name: 'Test Analyst', email: `${id}@example.com` }
	});
	await context.addCookies([
		{ name: 'authjs.session-token', value: token, url: origin, httpOnly: true, sameSite: 'Lax' }
	]);
}

test('protects the dashboard and every private API when signed out', async ({ request, page }) => {
	await page.goto('/');
	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeEnabled();
	for (const path of [
		'/api/account/keys',
		'/api/market/quote?symbol=AAPL',
		'/api/fred?series_id=GDP',
		'/api/polymarket'
	]) {
		expect((await request.get(path)).status()).toBe(401);
	}
	expect(
		(
			await request.patch('/api/account/preferences', { headers, data: { panelOrder: ['map'] } })
		).status()
	).toBe(401);
});

test('starts Google OAuth with a callback and PKCE cookie', async ({ request }) => {
	const response = await request.post('/auth/signin/google', {
		headers,
		form: { callbackUrl: '/' },
		maxRedirects: 0
	});
	expect(response.status()).toBe(302);
	const location = new URL(response.headers().location);
	expect(location.hostname).toBe('accounts.google.com');
	expect(location.searchParams.get('redirect_uri')).toBe(`${origin}/auth/callback/google`);
	expect(location.searchParams.get('code_challenge')).toBeTruthy();
	expect(response.headers()['set-cookie']).toContain('HttpOnly');
});

test('rejects forged sessions and cross-origin mutations', async ({ context }) => {
	await context.addCookies([
		{ name: 'authjs.session-token', value: 'forged-session', url: origin }
	]);
	expect((await context.request.get('/api/account/keys')).status()).toBe(401);
	await authenticate(context);
	const response = await context.request.put('/api/account/keys/finnhub', {
		headers: { Origin: 'https://other.example' },
		data: { key: 'some-private-key' }
	});
	expect(response.status()).toBe(403);
});

test('isolates saved keys, replacements, and deletion across accounts', async ({
	context,
	browser
}) => {
	await authenticate(context);
	const second = await browser.newContext();
	await authenticate(second);
	try {
		const alice = context.request;
		const bob = second.request;
		expect(
			(
				await alice.put('/api/account/keys/finnhub', {
					headers,
					data: { key: 'alice-private-key-1234' }
				})
			).ok()
		).toBe(true);
		expect((await bob.get('/api/account/keys')).status()).toBe(200);
		expect((await (await bob.get('/api/account/keys')).json()).keys).toEqual([]);
		const status = await alice.get('/api/account/keys');
		expect(status.headers()['cache-control']).toContain('no-store');
		expect(await status.text()).not.toContain('alice-private-key');
		expect(
			(
				await alice.put('/api/account/keys/finnhub', {
					headers,
					data: { key: 'replacement-key-5678' }
				})
			).ok()
		).toBe(true);
		expect((await (await alice.get('/api/account/keys')).json()).keys[0].hint).toContain('5678');
		expect((await bob.delete('/api/account/keys/finnhub', { headers })).ok()).toBe(true);
		expect((await (await alice.get('/api/account/keys')).json()).keys).toHaveLength(1);
		expect((await alice.delete('/api/account/keys/finnhub', { headers })).ok()).toBe(true);
		expect((await (await alice.get('/api/account/keys')).json()).keys).toEqual([]);
	} finally {
		await second.close();
	}
});

test('rejects invalid account payloads and reports missing provider keys', async ({ context }) => {
	await authenticate(context);
	const request = context.request;
	expect(
		(
			await request.put('/api/account/keys/unknown', { headers, data: { key: 'private-key' } })
		).status()
	).toBe(404);
	expect(
		(
			await request.put('/api/account/keys/finnhub', {
				headers,
				data: { key: 'short', userId: 'other' }
			})
		).status()
	).toBe(400);
	expect(
		(
			await request.patch('/api/account/preferences', {
				headers,
				data: { userId: 'other', panelOrder: ['map'] }
			})
		).status()
	).toBe(400);
	expect((await request.get('/api/market/quote?symbol=AAPL')).status()).toBe(409);
	expect((await request.get('/api/fred?series_id=GDP')).status()).toBe(409);
	expect((await request.get('/api/market/quote?symbol=http://localhost')).status()).toBe(400);
});

test('saves dashboard preferences, loads them after reload, and signs out', async ({
	context,
	page
}) => {
	await authenticate(context);
	// Keep public data providers out of this account UI test.
	await page.route('**/*', (route) => {
		if (new URL(route.request().url()).origin === origin) return route.continue();
		return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
	});
	await page.goto('/');
	await page.getByRole('button', { name: 'Settings', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Your connections' })).toBeVisible();
	const politics = page.getByRole('checkbox', { name: 'Politics', exact: true });
	await politics.uncheck();
	await page.getByLabel('Refresh interval').selectOption('300000');
	await expect(page.getByText('Dashboard settings saved to your account.')).toBeVisible();
	await page.reload();
	await page.getByRole('button', { name: 'Settings', exact: true }).click();
	await expect(politics).not.toBeChecked();
	await expect(page.getByLabel('Refresh interval')).toHaveValue('300000');
	await page.getByRole('button', { name: 'Close', exact: true }).click();
	await page.getByRole('button', { name: 'Sign out', exact: true }).click();
	await expect(page).toHaveURL(/\/login$/);
	expect((await context.request.get('/api/account/keys')).status()).toBe(401);
});

test('loads each account preferences independently on the same browser', async ({
	context,
	page
}) => {
	await authenticate(context);
	await context.request.patch('/api/account/preferences', {
		headers,
		data: { situationMonitorPanels: { politics: false } }
	});
	await context.clearCookies();
	await authenticate(context);
	await page.route('**/*', (route) =>
		new URL(route.request().url()).origin === origin
			? route.continue()
			: route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
	);
	await page.goto('/');
	await page.getByRole('button', { name: 'Settings', exact: true }).click();
	await expect(page.getByRole('checkbox', { name: 'Politics', exact: true })).toBeChecked();
});
