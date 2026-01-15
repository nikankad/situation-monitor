/**
 * Markets API - Fetch market data from Finnhub
 *
 * Get your free API key at: https://finnhub.io/
 * Free tier: 60 calls/minute
 */

import { INDICES, SECTORS, COMMODITIES, CRYPTO } from '$lib/config/markets';
import type { MarketItem, SectorPerformance, CryptoItem, PricePoint } from '$lib/types';
import { fetchWithProxy, logger, FINNHUB_API_KEY, FINNHUB_BASE_URL } from '$lib/config/api';

interface CoinGeckoPrice {
	usd: number;
	usd_24h_change?: number;
}

interface CoinGeckoPricesResponse {
	[key: string]: CoinGeckoPrice;
}

interface FinnhubQuote {
	c: number; // Current price
	d: number; // Change
	dp: number; // Percent change
	h: number; // High price of the day
	l: number; // Low price of the day
	o: number; // Open price of the day
	pc: number; // Previous close price
	t: number; // Timestamp
}

/**
 * Check if Finnhub API key is configured
 */
function hasFinnhubApiKey(): boolean {
	return Boolean(FINNHUB_API_KEY && FINNHUB_API_KEY.length > 0);
}

/**
 * Finnhub candle response
 */
interface FinnhubCandle {
	c: number[]; // Close prices
	h: number[]; // High prices
	l: number[]; // Low prices
	o: number[]; // Open prices
	t: number[]; // Timestamps (Unix)
	v: number[]; // Volumes
	s: string; // Status ("ok" or "no_data")
}

/**
 * Generate price history from OHLC data for visualization
 * Creates a simplified representation of the day's price action
 */
function generateHistoryFromOHLC(quote: FinnhubQuote | null): PricePoint[] {
	if (!quote || quote.c === 0) return [];

	const now = Date.now();
	const dayStart = now - 8 * 60 * 60 * 1000; // 8 hours ago (trading day)

	// Create points representing the day's price movement: Open -> Low -> High -> Current
	// This gives a simplified but meaningful visualization
	const points: PricePoint[] = [
		{ timestamp: dayStart, price: quote.o }, // Open
		{ timestamp: dayStart + 2 * 60 * 60 * 1000, price: quote.l }, // Low (simulated early)
		{ timestamp: dayStart + 5 * 60 * 60 * 1000, price: quote.h }, // High (simulated mid-day)
		{ timestamp: now, price: quote.c } // Current
	];

	return points;
}

/**
 * Create an empty market item (used for error/missing data states)
 */
function createEmptyMarketItem<T extends 'index' | 'commodity'>(
	symbol: string,
	name: string,
	type: T
): MarketItem {
	return {
		symbol,
		name,
		price: NaN,
		change: NaN,
		changePercent: NaN,
		type,
		high: NaN,
		low: NaN,
		open: NaN,
		previousClose: NaN
	};
}

/**
 * Create an empty sector performance item
 */
function createEmptySectorItem(symbol: string, name: string): SectorPerformance {
	return { symbol, name, price: NaN, change: NaN, changePercent: NaN };
}

// Map index symbols to ETF proxies (free tier doesn't support direct indices)
const INDEX_ETF_MAP: Record<string, string> = {
	'^DJI': 'DIA', // Dow Jones -> SPDR Dow Jones ETF
	'^GSPC': 'SPY', // S&P 500 -> SPDR S&P 500 ETF
	'^IXIC': 'QQQ', // NASDAQ -> Invesco QQQ (NASDAQ-100)
	'^RUT': 'IWM' // Russell 2000 -> iShares Russell 2000 ETF
};

/**
 * Fetch a quote from Finnhub
 */
async function fetchFinnhubQuote(symbol: string): Promise<FinnhubQuote | null> {
	try {
		const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data: FinnhubQuote = await response.json();

		// Finnhub returns all zeros when symbol not found
		if (data.c === 0 && data.pc === 0) {
			return null;
		}

		return data;
	} catch (error) {
		logger.error('Markets API', `Error fetching quote for ${symbol}:`, error);
		return null;
	}
}

/**
 * Fetch crypto prices from CoinGecko via proxy
 */
export async function fetchCryptoPrices(): Promise<CryptoItem[]> {
	try {
		const ids = CRYPTO.map((c) => c.id).join(',');
		const coinGeckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

		logger.log('Markets API', 'Fetching crypto from CoinGecko');

		const response = await fetchWithProxy(coinGeckoUrl);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data: CoinGeckoPricesResponse = await response.json();

		return CRYPTO.map((crypto) => {
			const priceData = data[crypto.id];
			return {
				id: crypto.id,
				symbol: crypto.symbol,
				name: crypto.name,
				current_price: priceData?.usd || 0,
				price_change_24h: priceData?.usd_24h_change || 0,
				price_change_percentage_24h: priceData?.usd_24h_change || 0
			};
		});
	} catch (error) {
		logger.error('Markets API', 'Error fetching crypto:', error);
		return CRYPTO.map((c) => ({
			id: c.id,
			symbol: c.symbol,
			name: c.name,
			current_price: 0,
			price_change_24h: 0,
			price_change_percentage_24h: 0
		}));
	}
}

/**
 * Fetch market indices from Finnhub with historical data
 */
export async function fetchIndices(): Promise<MarketItem[]> {
	const createEmptyIndices = () =>
		INDICES.map((i) => createEmptyMarketItem(i.symbol, i.name, 'index'));

	if (!hasFinnhubApiKey()) {
		logger.warn('Markets API', 'Finnhub API key not configured. Add VITE_FINNHUB_API_KEY to .env');
		return createEmptyIndices();
	}

	try {
		logger.log('Markets API', 'Fetching indices from Finnhub');

		const quotes = await Promise.all(
			INDICES.map(async (index) => {
				const etfSymbol = INDEX_ETF_MAP[index.symbol] || index.symbol;
				const quote = await fetchFinnhubQuote(etfSymbol);
				return { index, quote };
			})
		);

		return quotes.map(({ index, quote }) => ({
			symbol: index.symbol,
			name: index.name,
			price: quote?.c ?? NaN,
			change: quote?.d ?? NaN,
			changePercent: quote?.dp ?? NaN,
			type: 'index' as const,
			high: quote?.h ?? NaN,
			low: quote?.l ?? NaN,
			open: quote?.o ?? NaN,
			previousClose: quote?.pc ?? NaN,
			history: generateHistoryFromOHLC(quote)
		}));
	} catch (error) {
		logger.error('Markets API', 'Error fetching indices:', error);
		return createEmptyIndices();
	}
}

/**
 * Fetch sector performance from Finnhub (using sector ETFs)
 */
export async function fetchSectorPerformance(): Promise<SectorPerformance[]> {
	const createEmptySectors = () =>
		SECTORS.map((s) => createEmptySectorItem(s.symbol, s.name));

	if (!hasFinnhubApiKey()) {
		logger.warn('Markets API', 'Finnhub API key not configured');
		return createEmptySectors();
	}

	try {
		logger.log('Markets API', 'Fetching sector performance from Finnhub');

		const quotes = await Promise.all(
			SECTORS.map(async (sector) => {
				const quote = await fetchFinnhubQuote(sector.symbol);
				return { sector, quote };
			})
		);

		return quotes.map(({ sector, quote }) => ({
			symbol: sector.symbol,
			name: sector.name,
			price: quote?.c ?? NaN,
			change: quote?.d ?? NaN,
			changePercent: quote?.dp ?? NaN,
			type: 'sector' as const,
			high: quote?.h ?? NaN,
			low: quote?.l ?? NaN,
			open: quote?.o ?? NaN,
			previousClose: quote?.pc ?? NaN
		}));
	} catch (error) {
		logger.error('Markets API', 'Error fetching sectors:', error);
		return createEmptySectors();
	}
}

// Finnhub commodity ETF proxies (free tier doesn't support direct commodities)
const COMMODITY_SYMBOL_MAP: Record<string, string> = {
	'^VIX': 'VIXY', // VIX -> ProShares VIX Short-Term Futures ETF
	'GC=F': 'GLD', // Gold -> SPDR Gold Shares
	'CL=F': 'USO', // Crude Oil -> United States Oil Fund
	'NG=F': 'UNG', // Natural Gas -> United States Natural Gas Fund
	'SI=F': 'SLV', // Silver -> iShares Silver Trust
	'HG=F': 'CPER' // Copper -> United States Copper Index Fund
};

/**
 * Fetch commodities from Finnhub
 */
export async function fetchCommodities(): Promise<MarketItem[]> {
	const createEmptyCommodities = () =>
		COMMODITIES.map((c) => createEmptyMarketItem(c.symbol, c.name, 'commodity'));

	if (!hasFinnhubApiKey()) {
		logger.warn('Markets API', 'Finnhub API key not configured');
		return createEmptyCommodities();
	}

	try {
		logger.log('Markets API', 'Fetching commodities from Finnhub');

		const quotes = await Promise.all(
			COMMODITIES.map(async (commodity) => {
				const finnhubSymbol = COMMODITY_SYMBOL_MAP[commodity.symbol] || commodity.symbol;
				const quote = await fetchFinnhubQuote(finnhubSymbol);
				return { commodity, quote };
			})
		);

		return quotes.map(({ commodity, quote }) => ({
			symbol: commodity.symbol,
			name: commodity.name,
			price: quote?.c ?? NaN,
			change: quote?.d ?? NaN,
			changePercent: quote?.dp ?? NaN,
			type: 'commodity' as const,
			high: quote?.h ?? NaN,
			low: quote?.l ?? NaN,
			open: quote?.o ?? NaN,
			previousClose: quote?.pc ?? NaN
		}));
	} catch (error) {
		logger.error('Markets API', 'Error fetching commodities:', error);
		return createEmptyCommodities();
	}
}

/**
 * Fetch custom market symbols from Finnhub
 */
export async function fetchCustomMarkets(
	symbols: Array<{ symbol: string; name: string }>
): Promise<MarketItem[]> {
	if (!hasFinnhubApiKey() || symbols.length === 0) {
		return [];
	}

	try {
		logger.log('Markets API', `Fetching ${symbols.length} custom markets from Finnhub`);

		const quotes = await Promise.all(
			symbols.map(async ({ symbol, name }) => {
				const quote = await fetchFinnhubQuote(symbol);
				return { symbol, name, quote };
			})
		);

		return quotes.map(({ symbol, name, quote }) => ({
			symbol,
			name,
			price: quote?.c ?? NaN,
			change: quote?.d ?? NaN,
			changePercent: quote?.dp ?? NaN,
			type: 'stock' as const,
			high: quote?.h ?? NaN,
			low: quote?.l ?? NaN,
			open: quote?.o ?? NaN,
			previousClose: quote?.pc ?? NaN
		}));
	} catch (error) {
		logger.error('Markets API', 'Error fetching custom markets:', error);
		return symbols.map(({ symbol, name }) => ({
			symbol,
			name,
			price: NaN,
			change: NaN,
			changePercent: NaN,
			type: 'stock' as const,
			high: NaN,
			low: NaN,
			open: NaN,
			previousClose: NaN
		}));
	}
}

interface AllMarketsData {
	crypto: CryptoItem[];
	indices: MarketItem[];
	sectors: SectorPerformance[];
	commodities: MarketItem[];
}

/**
 * Fetch all market data
 */
export async function fetchAllMarkets(): Promise<AllMarketsData> {
	const [crypto, indices, sectors, commodities] = await Promise.all([
		fetchCryptoPrices(),
		fetchIndices(),
		fetchSectorPerformance(),
		fetchCommodities()
	]);

	return { crypto, indices, sectors, commodities };
}
