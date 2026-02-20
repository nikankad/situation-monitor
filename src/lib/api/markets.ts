/**
 * Markets data source (API-free)
 *
 * Generates deterministic synthetic market data so the dashboard works
 * in static hosting environments without external market APIs.
 */

import { INDICES, SECTORS, COMMODITIES, CRYPTO } from '$lib/config/markets';
import type { MarketItem, SectorPerformance, CryptoItem, PricePoint } from '$lib/types';

const SECTOR_MARKET_CAPS: Record<string, number> = {
	'XLK': 11000,
	'XLF': 5000,
	'XLV': 4500,
	'XLY': 3500,
	'XLI': 3000,
	'XLP': 2500,
	'XLE': 2000,
	'XLRE': 1500,
	'XLU': 1500,
	'XLB': 1000
};

function stringHash(value: string): number {
	let hash = 2166136261;
	for (let i = 0; i < value.length; i += 1) {
		hash ^= value.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return Math.abs(hash >>> 0);
}

function seededUnit(seed: number): number {
	const x = Math.sin(seed * 12.9898) * 43758.5453123;
	return x - Math.floor(x);
}

function seededRange(seed: number, min: number, max: number): number {
	return min + seededUnit(seed) * (max - min);
}

function round(value: number, decimals = 2): number {
	const factor = Math.pow(10, decimals);
	return Math.round(value * factor) / factor;
}

function getTimeBucket(minutes = 5): number {
	return Math.floor(Date.now() / (minutes * 60 * 1000));
}

function buildHistory(current: number, previousClose: number): PricePoint[] {
	const now = Date.now();
	const points: PricePoint[] = [];
	const start = now - 7 * 60 * 60 * 1000;

	for (let i = 0; i < 8; i += 1) {
		const progress = i / 7;
		const drift = previousClose + (current - previousClose) * progress;
		const wiggle = (seededUnit((i + 1) * 7919 + Math.floor(current * 100)) - 0.5) * current * 0.004;
		points.push({
			timestamp: start + i * 60 * 60 * 1000,
			price: round(Math.max(0.01, drift + wiggle), 2)
		});
	}

	return points;
}

function buildQuote(symbol: string, baselineMin: number, baselineMax: number) {
	const hash = stringHash(symbol);
	const timeBucket = getTimeBucket();
	const basePrice = seededRange(hash, baselineMin, baselineMax);
	const volatility = seededRange(hash + 17, 0.003, 0.025);
	const momentum = (seededUnit(timeBucket + hash) - 0.5) * 2;
	const changePercent = round(momentum * volatility * 100, 2);
	const previousClose = round(basePrice, 2);
	const change = round((previousClose * changePercent) / 100, 2);
	const price = round(Math.max(0.01, previousClose + change), 2);
	const high = round(Math.max(price, previousClose) * (1 + seededRange(hash + timeBucket, 0.001, 0.008)), 2);
	const low = round(Math.min(price, previousClose) * (1 - seededRange(hash + timeBucket + 1, 0.001, 0.008)), 2);
	const open = round(previousClose * (1 + seededRange(hash + timeBucket + 2, -0.002, 0.002)), 2);

	return {
		price,
		change,
		changePercent,
		high,
		low,
		open,
		previousClose
	};
}

export async function fetchIndices(): Promise<MarketItem[]> {
	return INDICES.map((index) => {
		const quote = buildQuote(index.symbol, 3500, 45000);
		return {
			symbol: index.symbol,
			name: index.name,
			price: quote.price,
			change: quote.change,
			changePercent: quote.changePercent,
			type: 'index',
			high: quote.high,
			low: quote.low,
			open: quote.open,
			previousClose: quote.previousClose,
			history: buildHistory(quote.price, quote.previousClose)
		};
	});
}

export async function fetchSectorPerformance(): Promise<SectorPerformance[]> {
	return SECTORS.map((sector) => {
		const quote = buildQuote(sector.symbol, 30, 250);
		return {
			symbol: sector.symbol,
			name: sector.name,
			price: quote.price,
			change: quote.change,
			changePercent: quote.changePercent,
			type: 'sector',
			high: quote.high,
			low: quote.low,
			open: quote.open,
			previousClose: quote.previousClose,
			marketCap: SECTOR_MARKET_CAPS[sector.symbol] ?? 1000
		};
	});
}

export async function fetchCommodities(): Promise<MarketItem[]> {
	return COMMODITIES.map((commodity) => {
		const quote = buildQuote(commodity.symbol, 20, 2500);
		return {
			symbol: commodity.symbol,
			name: commodity.name,
			price: quote.price,
			change: quote.change,
			changePercent: quote.changePercent,
			type: 'commodity',
			high: quote.high,
			low: quote.low,
			open: quote.open,
			previousClose: quote.previousClose,
			history: buildHistory(quote.price, quote.previousClose)
		};
	});
}

export async function fetchCryptoPrices(): Promise<CryptoItem[]> {
	return CRYPTO.map((crypto) => {
		const quote = buildQuote(crypto.id, 50, 110000);
		return {
			id: crypto.id,
			symbol: crypto.symbol,
			name: crypto.name,
			current_price: quote.price,
			price_change_24h: quote.change,
			price_change_percentage_24h: quote.changePercent
		};
	});
}

export async function fetchCustomMarkets(
	symbols: Array<{ symbol: string; name: string }>
): Promise<MarketItem[]> {
	return symbols.map(({ symbol, name }) => {
		const quote = buildQuote(symbol, 5, 2000);
		return {
			symbol,
			name,
			price: quote.price,
			change: quote.change,
			changePercent: quote.changePercent,
			type: 'stock',
			high: quote.high,
			low: quote.low,
			open: quote.open,
			previousClose: quote.previousClose,
			history: buildHistory(quote.price, quote.previousClose)
		};
	});
}

interface AllMarketsData {
	crypto: CryptoItem[];
	indices: MarketItem[];
	sectors: SectorPerformance[];
	commodities: MarketItem[];
}

export async function fetchAllMarkets(): Promise<AllMarketsData> {
	const [crypto, indices, sectors, commodities] = await Promise.all([
		fetchCryptoPrices(),
		fetchIndices(),
		fetchSectorPerformance(),
		fetchCommodities()
	]);

	return { crypto, indices, sectors, commodities };
}
