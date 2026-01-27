/**
 * Market configuration - sectors, commodities, stocks
 */

export interface SectorConfig {
	symbol: string;
	name: string;
}

export interface CommodityConfig {
	symbol: string;
	name: string;
	display: string;
}

export const SECTORS: SectorConfig[] = [
	{ symbol: 'XLK', name: 'Tech' },
	{ symbol: 'XLF', name: 'Finance' },
	{ symbol: 'XLV', name: 'Healthcare' },
	{ symbol: 'XLY', name: 'Consumer Disc' },
	{ symbol: 'XLI', name: 'Industrials' },
	{ symbol: 'XLP', name: 'Consumer Staples' },
	{ symbol: 'XLE', name: 'Energy' },
	{ symbol: 'XLRE', name: 'Real Estate' },
	{ symbol: 'XLU', name: 'Utilities' },
	{ symbol: 'XLB', name: 'Materials' }
];

export const COMMODITIES: CommodityConfig[] = [
	{ symbol: '^VIX', name: 'VIX', display: 'VIX' },
	{ symbol: 'GC=F', name: 'Gold', display: 'GOLD' },
	{ symbol: 'CL=F', name: 'Crude Oil', display: 'OIL' }
];

// Major stock indices
export const INDICES = [
	{ symbol: '^DJI', name: 'Dow Jones', display: 'DOW' },
	{ symbol: '^GSPC', name: 'S&P 500', display: 'S&P' },
	{ symbol: '^IXIC', name: 'NASDAQ', display: 'NDQ' }
];

// Crypto assets tracked
export const CRYPTO = [
	{ id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
	{ id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
	{ id: 'solana', symbol: 'SOL', name: 'Solana' }
];
