/**
 * Server-side proxy for Polymarket Gamma API
 * Fetches market data and returns it to the client
 * Works around CORS restrictions by handling the request server-side
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const res = await fetch(
			'https://gamma-api.polymarket.com/markets?active=true&closed=false&order=volume24hr&ascending=false&limit=100&marketType=normal',
			{
				method: 'GET',
				headers: {
					'Accept': 'application/json'
				}
			}
		);

		if (!res.ok) {
			return json({ error: `API returned ${res.status}` }, { status: res.status });
		}

		const markets = await res.json();

		// Filter to only markets that have working Polymarket event pages
		const filtered = markets.filter((m: Record<string, unknown>) => {
			const slug = m.slug as string | undefined;
			// Only include markets with non-empty slugs (rough heuristic)
			return slug && slug.length > 0 && !slug.includes('/') && !slug.includes('\\');
		});

		return json(filtered.slice(0, 20));
	} catch (error) {
		console.error('Polymarket proxy error:', error);
		return json({ error: 'Failed to fetch polymarket data' }, { status: 500 });
	}
};
