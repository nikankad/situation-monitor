/**
 * Tests for markets store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// Mock $app/environment
vi.mock('$app/environment', () => ({
	browser: true
}));

describe('Markets Store', () => {
	beforeEach(async () => {
		vi.resetModules();
	});

	it('should start with empty markets', async () => {
		const { markets } = await import('./markets');

		const state = get(markets);
		expect(state.indices.items).toEqual([]);
		expect(state.sectors.items).toEqual([]);
		expect(state.commodities.items).toEqual([]);
		expect(state.crypto.items).toEqual([]);
	});

	it('should set indices data', async () => {
		const { markets, indices } = await import('./markets');

		const indexData = [
			{ symbol: '^DJI', name: 'Dow Jones', price: 38000, change: 150, changePercent: 0.4 },
			{ symbol: '^GSPC', name: 'S&P 500', price: 5000, change: 25, changePercent: 0.5 }
		];

		markets.setIndices(indexData);

		const data = get(indices);
		expect(data.items.length).toBe(2);
		expect(data.loading).toBe(false);
		expect(data.lastUpdated).not.toBeNull();
	});

	it('should set sectors data', async () => {
		const { markets, sectors } = await import('./markets');

		const sectorData = [
			{ symbol: 'XLK', name: 'Tech', price: 200, change: 2, changePercent: 1.0 },
			{ symbol: 'XLF', name: 'Finance', price: 40, change: -0.5, changePercent: -1.25 }
		];

		markets.setSectors(sectorData);

		const data = get(sectors);
		expect(data.items.length).toBe(2);
	});

	it('should set commodities data', async () => {
		const { markets, commodities, vix } = await import('./markets');

		const commodityData = [
			{ symbol: '^VIX', name: 'VIX', price: 15, change: 0.5, changePercent: 3.4 },
			{ symbol: 'GC=F', name: 'Gold', price: 2000, change: 10, changePercent: 0.5 }
		];

		markets.setCommodities(commodityData);

		const data = get(commodities);
		expect(data.items.length).toBe(2);

		const vixData = get(vix);
		expect(vixData?.symbol).toBe('^VIX');
		expect(vixData?.price).toBe(15);
	});

	it('should set crypto data', async () => {
		const { markets, crypto } = await import('./markets');

		const cryptoData = [
			{
				id: 'bitcoin',
				symbol: 'BTC',
				name: 'Bitcoin',
				current_price: 95000,
				price_change_24h: 1500,
				price_change_percentage_24h: 1.6
			},
			{
				id: 'ethereum',
				symbol: 'ETH',
				name: 'Ethereum',
				current_price: 3500,
				price_change_24h: -50,
				price_change_percentage_24h: -1.4
			}
		];

		markets.setCrypto(cryptoData);

		const data = get(crypto);
		expect(data.items.length).toBe(2);
		expect(data.items[0].id).toBe('bitcoin');
	});

	it('should set loading state', async () => {
		const { markets, isMarketsLoading } = await import('./markets');

		markets.setLoading('indices', true);
		expect(get(isMarketsLoading)).toBe(true);

		markets.setLoading('indices', false);
		expect(get(isMarketsLoading)).toBe(false);
	});

	it('should set error state', async () => {
		const { markets, indices } = await import('./markets');

		markets.setError('indices', 'API error');

		const data = get(indices);
		expect(data.error).toBe('API error');
		expect(data.loading).toBe(false);
	});

	it('should update single market item', async () => {
		const { markets, indices } = await import('./markets');

		markets.setIndices([
			{ symbol: '^DJI', name: 'Dow', price: 38000, change: 0, changePercent: 0 }
		]);

		markets.updateItem('indices', '^DJI', { price: 38100, change: 100, changePercent: 0.26 });

		const data = get(indices);
		expect(data.items[0].price).toBe(38100);
		expect(data.items[0].change).toBe(100);
	});

	it('should get market summary', async () => {
		const { markets } = await import('./markets');

		markets.setIndices([
			{ symbol: 'A', name: 'A', price: 100, change: 5, changePercent: 5 },
			{ symbol: 'B', name: 'B', price: 100, change: 3, changePercent: 3 },
			{ symbol: 'C', name: 'C', price: 100, change: -1, changePercent: -1 }
		]);

		const summary = markets.getSummary();
		expect(summary.marketTrend).toBe('up');
		expect(summary.topGainer?.symbol).toBe('A');
		expect(summary.topLoser?.symbol).toBe('C');
	});

	it('should derive last updated correctly', async () => {
		const { markets, marketsLastUpdated } = await import('./markets');

		expect(get(marketsLastUpdated)).toBeNull();

		markets.setIndices([{ symbol: 'A', name: 'A', price: 100, change: 0, changePercent: 0 }]);

		const lastUpdated = get(marketsLastUpdated);
		expect(lastUpdated).not.toBeNull();
		expect(lastUpdated).toBeLessThanOrEqual(Date.now());
	});

	it('should clear all data', async () => {
		const { markets } = await import('./markets');

		markets.setIndices([{ symbol: 'A', name: 'A', price: 100, change: 0, changePercent: 0 }]);
		markets.setCrypto([
			{
				id: 'btc',
				symbol: 'BTC',
				name: 'Bitcoin',
				current_price: 100,
				price_change_24h: 0,
				price_change_percentage_24h: 0
			}
		]);

		markets.clearAll();

		const state = get(markets);
		expect(state.indices.items).toEqual([]);
		expect(state.crypto.items).toEqual([]);
	});
});
