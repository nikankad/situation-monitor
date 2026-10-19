/**
 * Miscellaneous API functions for specialized panels
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
	endDate?: string;
	outcomes: Outcome[];
}

export interface Contract {
	id: string;
	agency: string;
	subAgency: string;
	description: string;
	vendor: string;
	amount: number;
	date: string;
	url: string;
}

const POLYMARKET_API =
	'https://gamma-api.polymarket.com/events?active=true&closed=false&order=volume24hr&ascending=false&limit=100';

// Sports and esports dominate Polymarket volume but aren't relevant to this dashboard
const EXCLUDED_POLYMARKET_TAGS = new Set(['sports', 'esports', 'games']);

const MAX_PREDICTIONS = 30;

/**
 * Gamma API encodes array fields (outcomes, outcomePrices) as JSON strings
 */
function parseJsonArray(value: unknown): string[] {
	if (Array.isArray(value)) return value.map(String);
	if (typeof value !== 'string') return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed.map(String) : [];
	} catch {
		return [];
	}
}

/**
 * Build the outcomes shown for an event, highest probability first.
 * Multi-market events (e.g. "Who will win X?") list each candidate's "Yes" price;
 * single-market events list that market's own outcomes (e.g. Yes / No).
 */
function getEventOutcomes(markets: Array<Record<string, unknown>>): Outcome[] {
	const openMarkets = markets.filter((m) => !m.closed);

	let outcomes: Outcome[];
	if (openMarkets.length > 1) {
		outcomes = openMarkets.map((m) => ({
			title: String(m.groupItemTitle || m.question),
			price: Number(parseJsonArray(m.outcomePrices)[0]) || 0
		}));
	} else if (openMarkets.length === 1) {
		const names = parseJsonArray(openMarkets[0].outcomes);
		const prices = parseJsonArray(openMarkets[0].outcomePrices);
		outcomes = names.map((title, i) => ({
			title,
			price: Number(prices[i]) || 0
		}));
	} else {
		outcomes = [];
	}

	// Hide near-zero outcomes (often placeholder candidates like "Person A") unless nothing else is left
	const meaningful = outcomes.filter((o) => o.price >= 0.01);

	return (meaningful.length > 0 ? meaningful : outcomes)
		.sort((a, b) => b.price - a.price)
		.slice(0, 3);
}

/**
 * Fetch Polymarket predictions via the CORS proxy
 * Returns the highest 24h-volume active events, excluding sports
 */
export async function fetchPolymarket(): Promise<Prediction[]> {
	try {
		const res = await fetchWithProxy(POLYMARKET_API);

		if (!res.ok) {
			logger.warn('Polymarket', `API returned ${res.status}`);
			return [];
		}

		const events: Array<Record<string, unknown>> = await res.json();
		logger.log('Polymarket', `Fetched ${events.length} events`);

		return events
			.filter((e) => {
				const tags = (e.tags as Array<{ slug?: string }> | undefined) ?? [];
				return e.title && !tags.some((t) => t.slug && EXCLUDED_POLYMARKET_TAGS.has(t.slug));
			})
			.map((e) => ({
				id: String(e.id),
				question: String(e.title),
				volume: Number(e.volume24hr) || 0,
				url: e.slug ? `https://polymarket.com/event/${e.slug}` : 'https://polymarket.com',
				endDate: e.endDate ? String(e.endDate) : undefined,
				outcomes: getEventOutcomes((e.markets as Array<Record<string, unknown>>) ?? [])
			}))
			.filter((p) => p.outcomes.length > 0)
			.slice(0, MAX_PREDICTIONS);
	} catch (error) {
		logger.error('Polymarket', 'Failed to fetch predictions:', error);
		return [];
	}
}

const USASPENDING_API = 'https://api.usaspending.gov/api/v2/search/spending_by_award/';
const CONTRACT_LOOKBACK_DAYS = 30;

function toIsoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

/**
 * Fetch the largest new federal contract awards from USASpending.gov
 * The API allows cross-origin requests, so no proxy is needed
 */
export async function fetchGovContracts(): Promise<Contract[]> {
	const end = new Date();
	const start = new Date(end.getTime() - CONTRACT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

	try {
		const res = await fetch(USASPENDING_API, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				filters: {
					// A-D = definitive contracts, purchase orders, delivery orders, BPA calls
					award_type_codes: ['A', 'B', 'C', 'D'],
					time_period: [
						{
							start_date: toIsoDate(start),
							end_date: toIsoDate(end),
							date_type: 'new_awards_only'
						}
					]
				},
				fields: [
					'Award ID',
					'Recipient Name',
					'Award Amount',
					'Awarding Agency',
					'Awarding Sub Agency',
					'Description',
					'Start Date',
					'generated_internal_id'
				],
				sort: 'Award Amount',
				order: 'desc',
				limit: 25
			})
		});

		if (!res.ok) {
			logger.warn('Contracts', `USASpending returned ${res.status}`);
			return [];
		}

		const data: { results?: Array<Record<string, unknown>> } = await res.json();

		return (data.results ?? []).map((r) => ({
			id: String(r.generated_internal_id ?? r['Award ID']),
			agency: String(r['Awarding Agency'] ?? ''),
			subAgency: String(r['Awarding Sub Agency'] ?? ''),
			description: String(r.Description ?? ''),
			vendor: String(r['Recipient Name'] ?? ''),
			amount: Number(r['Award Amount']) || 0,
			date: String(r['Start Date'] ?? ''),
			url: r.generated_internal_id
				? `https://www.usaspending.gov/award/${r.generated_internal_id}`
				: 'https://www.usaspending.gov'
		}));
	} catch (error) {
		logger.error('Contracts', 'Failed to fetch contracts:', error);
		return [];
	}
}
