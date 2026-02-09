/**
 * Miscellaneous API functions for specialized panels
 * Note: Some of these use mock data as the original APIs require authentication
 */

import { base } from '$app/paths';
import { logger } from '$lib/config/api';

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

/**
 * Fetch Polymarket predictions from the Gamma API via server-side proxy
 * Returns the highest-volume active markets
 *
 * Note: Uses a server-side route to bypass CORS restrictions on the Gamma API
 */
export async function fetchPolymarket(): Promise<Prediction[]> {
	try {
		const res = await fetch(`${base}/api/polymarket`, {
			method: 'GET',
			headers: {
				'Accept': 'application/json'
			}
		});

		if (!res.ok) {
			logger.warn('Polymarket', `API returned ${res.status}`);
			return [];
		}

		const markets = await res.json();

		logger.log('Polymarket', `Fetched ${markets.length} markets`);

		return markets
			.filter((m: Record<string, unknown>) => m.question)
			.map((m: Record<string, unknown>) => {
				// Get event slug from nested events array for working URLs
				const events = m.events as Array<Record<string, unknown>> | undefined;
				const eventSlug = events?.[0]?.slug as string | undefined;
				const url = eventSlug
					? `https://polymarket.com/event/${eventSlug}`
					: 'https://polymarket.com';

				return {
					id: String(m.id),
					question: String(m.question),
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
