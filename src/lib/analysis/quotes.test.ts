/**
 * Tests for quote lookup
 */

import { describe, it, expect } from 'vitest';
import { findQuote } from './quotes';

const empty = { items: [] };

function markets(overrides: Record<string, { items: unknown[] }>) {
	return {
		indices: empty,
		sectors: empty,
		commodities: empty,
		crypto: empty,
		custom: empty,
		...overrides
	} as unknown as Parameters<typeof findQuote>[0];
}

describe('findQuote', () => {
	it('finds a market item and keeps its day range', () => {
		const quote = findQuote(
			markets({
				commodities: {
					items: [
						{
							symbol: 'CL=F',
							name: 'Crude Oil',
							price: 81.2,
							change: 2.5,
							changePercent: 3.2,
							open: 78.7,
							high: 82.1,
							low: 78.3,
							previousClose: 78.7
						}
					]
				}
			}),
			'CL=F'
		);
		expect(quote).toMatchObject({ price: 81.2, changePercent: 3.2, high: 82.1, low: 78.3 });
	});

	it('returns null for a quote that failed to load', () => {
		const result = findQuote(
			markets({
				indices: {
					items: [{ symbol: '^GSPC', name: 'S&P', price: NaN, change: NaN, changePercent: NaN }]
				}
			}),
			'^GSPC'
		);
		expect(result).toBeNull();
	});

	it('finds crypto by upper-case symbol', () => {
		const quote = findQuote(
			markets({
				crypto: {
					items: [
						{
							id: 'bitcoin',
							symbol: 'btc',
							name: 'Bitcoin',
							current_price: 64000,
							price_change_24h: -900,
							price_change_percentage_24h: -1.4
						}
					]
				}
			}),
			'BTC'
		);
		expect(quote).toMatchObject({ price: 64000, changePercent: -1.4 });
		expect(quote!.high).toBeUndefined();
	});

	it('returns null for an unknown symbol', () => {
		expect(findQuote(markets({}), 'NOPE')).toBeNull();
	});
});
