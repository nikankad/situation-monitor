// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET as quote } from '../../routes/api/market/quote/+server';
import { GET as fred } from '../../routes/api/fred/+server';

const getKey = vi.hoisted(() =>
	vi.fn((userId: string, provider: string) => `${userId}-${provider}-secret`)
);
vi.mock('$lib/server/accounts', () => ({ accounts: () => ({ getKey }) }));
afterEach(() => {
	vi.restoreAllMocks();
});

function event(path: string, userId: string) {
	return {
		url: new URL(path, 'https://monitor.example.com'),
		locals: { session: { user: { id: userId } } }
	};
}

describe('private data provider requests', () => {
	it('uses each account Finnhub key in a server header and returns only quote fields', async () => {
		const fetch = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(
				async () => new Response(JSON.stringify({ c: 100, pc: 99, token: 'echoed-provider-key' }))
			);
		const response = await quote(
			event('/api/market/quote?symbol=AAPL', 'alice') as Parameters<typeof quote>[0]
		);
		expect(getKey).toHaveBeenCalledWith('alice', 'finnhub');
		const [url, options] = fetch.mock.calls[0];
		expect(String(url)).toBe('https://finnhub.io/api/v1/quote?symbol=AAPL');
		expect(new Headers(options?.headers).get('X-Finnhub-Token')).toBe('alice-finnhub-secret');
		expect(options?.redirect).toBe('error');
		const body = await response.json();
		expect(body.c).toBe(100);
		expect(body.token).toBeUndefined();
		await quote(event('/api/market/quote?symbol=AAPL', 'bob') as Parameters<typeof quote>[0]);
		expect(new Headers(fetch.mock.calls[1][1]?.headers).get('X-Finnhub-Token')).toBe(
			'bob-finnhub-secret'
		);
	});

	it('bounds FRED requests to a fixed endpoint and filters the provider response', async () => {
		const fetch = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(
				new Response(
					JSON.stringify({
						api_key: 'provider-key',
						observations: [{ date: '2026-01-01', value: '4.5', secret: 'not-returned' }]
					})
				)
			);
		const response = await fred(
			event('/api/fred?series_id=GDP&limit=999999&api_key=attacker', 'alice') as Parameters<
				typeof fred
			>[0]
		);
		const url = new URL(String(fetch.mock.calls[0][0]));
		expect(url.origin).toBe('https://api.stlouisfed.org');
		expect(url.searchParams.get('api_key')).toBe('alice-fred-secret');
		expect(url.searchParams.get('limit')).toBe('100');
		expect(await response.json()).toEqual({ observations: [{ date: '2026-01-01', value: '4.5' }] });
	});

	it('does not expose provider error bodies containing credentials', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response('Rejected alice-finnhub-secret', { status: 401 })
		);
		await expect(
			quote(event('/api/market/quote?symbol=AAPL', 'alice') as Parameters<typeof quote>[0])
		).rejects.toMatchObject({
			status: 422,
			body: { message: 'Provider rejected your API key. Check Settings.' }
		});
	});
});
