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
	{ symbol: 'XLE', name: 'Energy' },
	{ symbol: 'XLV', name: 'Health' },
	{ symbol: 'XLY', name: 'Consumer' },
	{ symbol: 'XLI', name: 'Industrial' },
	{ symbol: 'XLP', name: 'Staples' },
	{ symbol: 'XLU', name: 'Utilities' },
	{ symbol: 'XLB', name: 'Materials' },
	{ symbol: 'XLRE', name: 'Real Est' },
	{ symbol: 'XLC', name: 'Comms' },
	{ symbol: 'SMH', name: 'Semis' }
];

export const COMMODITIES: CommodityConfig[] = [
	{ symbol: '^VIX', name: 'VIX', display: 'VIX' },
	{ symbol: 'GC=F', name: 'Gold', display: 'GOLD' },
	{ symbol: 'CL=F', name: 'Crude Oil', display: 'OIL' },
	{ symbol: 'NG=F', name: 'Natural Gas', display: 'NATGAS' },
	{ symbol: 'SI=F', name: 'Silver', display: 'SILVER' },
	{ symbol: 'HG=F', name: 'Copper', display: 'COPPER' }
];

// Major stock indices
export const INDICES = [
	{ symbol: '^DJI', name: 'Dow Jones', display: 'DOW' },
	{ symbol: '^GSPC', name: 'S&P 500', display: 'S&P' },
	{ symbol: '^IXIC', name: 'NASDAQ', display: 'NDQ' },
	{ symbol: '^RUT', name: 'Russell 2000', display: 'RUT' }
];

// Crypto assets tracked
export const CRYPTO = [
	{ id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
	{ id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
	{ id: 'solana', symbol: 'SOL', name: 'Solana' }
];
