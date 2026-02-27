/**
 * Miscellaneous API functions for specialized panels
 * Note: Some of these use mock data as the original APIs require authentication
 */

import { fetchWithProxy, logger } from '$lib/config/api';

export interface Outcome {
	title: string;
	price: number;
}

export interface Prediction {
	id: string;
	question: string;
	volume: number;
	url: string;
	outcomes: Outcome[];
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

		// Deduplicate markets by question title, keeping the one with highest volume
		const dedupeMap = new Map<string, Prediction>();

		markets
			.filter((m: Record<string, unknown>) => m.question)
			.forEach((m: Record<string, unknown>) => {
				// Get event slug from nested events array for working URLs
				const events = m.events as Array<Record<string, unknown>> | undefined;
				const eventSlug = events?.[0]?.slug as string | undefined;
				const url = eventSlug
					? `https://polymarket.com/event/${eventSlug}`
					: 'https://polymarket.com';

				// Get outcomes and prices, then sort by price (descending) and take top 3
				const outcomeNames = m.outcomes as string[] | undefined;
				const outcomePricesRaw = m.outcomePrices as string[] | undefined;
				
				let topOutcomes: Outcome[] = [];
				if (outcomeNames && outcomePricesRaw && outcomeNames.length === outcomePricesRaw.length) {
					const withPrices = outcomeNames.map((name, i) => ({
						title: name,
						price: Number(outcomePricesRaw[i]) || 0
					}));
					// Sort by price descending and take top 3
					topOutcomes = withPrices
						.sort((a, b) => b.price - a.price)
						.slice(0, 3);
				}

				const prediction: Prediction = {
					id: String(m.id),
					question: (events?.[0]?.title as string | undefined) || String(m.question),
					volume: Number(m.volume24hr) || 0,
					url,
					outcomes: topOutcomes
				};

				const key = prediction.question.toLowerCase();
				const existing = dedupeMap.get(key);

				// Keep the market with highest volume
				if (!existing || prediction.volume > existing.volume) {
					dedupeMap.set(key, prediction);
				}
			});

		const results = Array.from(dedupeMap.values());
		logger.log('Polymarket', `Returning ${results.length} deduplicated markets`);
		if (results.length > 0) {
			logger.log('Polymarket', `First market: ${results[0].question}, outcomes: ${results[0].outcomes.length}`);
		}
		return results;
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
