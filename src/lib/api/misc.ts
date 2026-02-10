/**
 * Miscellaneous API functions for specialized panels
 * Note: Some of these use mock data as the original APIs require authentication
 */

import { fetchWithProxy, logger } from '$lib/config/api';

export interface Prediction {
	id: string;
	question: string;
	volume: number;
	url: string;
}

export interface WhaleTransaction {
	coin: string;
	amount: number;
	usd: number;
	hash: string;
}

export interface Contract {
	agency: string;
	description: string;
	vendor: string;
	amount: number;
}

const POLYMARKET_API =
	'https://gamma-api.polymarket.com/markets?active=true&closed=false&order=volume24hr&ascending=false&limit=100&marketType=normal';

/**
 * Fetch Polymarket predictions via the CORS proxy
 * Returns the highest-volume active markets
 */
export async function fetchPolymarket(): Promise<Prediction[]> {
	try {
		const res = await fetchWithProxy(POLYMARKET_API);

		if (!res.ok) {
			logger.warn('Polymarket', `API returned ${res.status}`);
			return [];
		}

		const markets = await res.json();

		logger.log('Polymarket', `Fetched ${markets.length} markets`);

		return markets
			.filter((m: Record<string, unknown>) => {
				const slug = m.slug as string | undefined;
				return m.question && slug && slug.length > 0 && !slug.includes('/');
			})
			.slice(0, 20)
			.map((m: Record<string, unknown>) => {
				const events = m.events as Array<Record<string, unknown>> | undefined;
				const eventSlug = events?.[0]?.slug as string | undefined;
				const eventTitle = events?.[0]?.title as string | undefined;
				const url = eventSlug
					? `https://polymarket.com/event/${eventSlug}`
					: 'https://polymarket.com';

				return {
					id: String(m.id),
					question: eventTitle || String(m.question),
					volume: Number(m.volume24hr) || 0,
					url
				};
			});
	} catch (error) {
		logger.error('Polymarket', 'Failed to fetch predictions:', error);
		return [];
	}
}

/**
 * Fetch whale transactions
 * Note: Would use Whale Alert API - currently returns empty data
 */
export async function fetchWhaleTransactions(): Promise<WhaleTransaction[]> {
	return [];
}

/**
 * Fetch government contracts
 * Note: Would use USASpending.gov API - currently returns empty data
 */
export async function fetchGovContracts(): Promise<Contract[]> {
	return [];
}
