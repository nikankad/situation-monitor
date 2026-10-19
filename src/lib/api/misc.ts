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
 * The Gamma API returns list fields such as `outcomes` and `outcomePrices` as
 * JSON-encoded strings (e.g. '["Yes", "No"]'); accept real arrays too.
 */
function parseStringArray(value: unknown): string[] {
	if (Array.isArray(value)) return value.map(String);
	if (typeof value !== 'string') return [];
	try {
		const parsed: unknown = JSON.parse(value);
		return Array.isArray(parsed) ? parsed.map(String) : [];
	} catch {
		return [];
	}
}

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
				const outcomeNames = parseStringArray(m.outcomes);
				const outcomePrices = parseStringArray(m.outcomePrices);

				let topOutcomes: Outcome[] = [];
				if (outcomeNames.length > 0 && outcomeNames.length === outcomePrices.length) {
					topOutcomes = outcomeNames
						.map((name, i) => ({ title: name, price: Number(outcomePrices[i]) || 0 }))
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
