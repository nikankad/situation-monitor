/**
 * Quotes - looks up an asset's latest price across the markets store sections
 */

import type { MarketsState } from '$lib/stores/markets';

export interface AssetQuote {
	symbol: string;
	name: string;
	price: number;
	change: number;
	changePercent: number;
	open?: number;
	high?: number;
	low?: number;
	previousClose?: number;
}

type QuoteSource = Pick<MarketsState, 'indices' | 'sectors' | 'commodities' | 'crypto' | 'custom'>;

function usable(price: number): boolean {
	return Number.isFinite(price) && price > 0;
}

function finiteOrUndefined(value: number | undefined): number | undefined {
	return value !== undefined && Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * The latest quote for a market symbol, or null when it has not loaded
 * (for example stock prices without a Finnhub key)
 */
export function findQuote(markets: QuoteSource, symbol: string): AssetQuote | null {
	for (const item of [
		...markets.indices.items,
		...markets.sectors.items,
		...markets.commodities.items,
		...markets.custom.items
	]) {
		if (item.symbol === symbol && usable(item.price)) {
			return {
				symbol: item.symbol,
				name: item.name,
				price: item.price,
				change: Number.isFinite(item.change) ? item.change : 0,
				changePercent: Number.isFinite(item.changePercent) ? item.changePercent : 0,
				open: finiteOrUndefined(item.open),
				high: finiteOrUndefined(item.high),
				low: finiteOrUndefined(item.low),
				previousClose: finiteOrUndefined(item.previousClose)
			};
		}
	}

	for (const coin of markets.crypto.items) {
		if (coin.symbol.toUpperCase() === symbol && usable(coin.current_price)) {
			return {
				symbol,
				name: coin.name,
				price: coin.current_price,
				change: coin.price_change_24h,
				changePercent: coin.price_change_percentage_24h
			};
		}
	}

	return null;
}
