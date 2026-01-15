/**
 * Markets store - stocks, crypto, commodities, indices
 */

import { writable, derived, get } from 'svelte/store';
import type { MarketItem, CryptoItem, SectorPerformance } from '$lib/types';

export interface MarketsState {
	// Stock indices (DOW, S&P, NASDAQ, Russell)
	indices: {
		items: MarketItem[];
		loading: boolean;
		error: string | null;
		lastUpdated: number | null;
	};

	// Sector ETFs (XLK, XLF, etc.)
	sectors: {
		items: SectorPerformance[];
		loading: boolean;
		error: string | null;
		lastUpdated: number | null;
	};

	// Commodities (Gold, Oil, VIX, etc.)
	commodities: {
		items: MarketItem[];
		loading: boolean;
		error: string | null;
		lastUpdated: number | null;
	};

	// Crypto (BTC, ETH, SOL)
	crypto: {
		items: CryptoItem[];
		loading: boolean;
		error: string | null;
		lastUpdated: number | null;
	};

	initialized: boolean;
}

type MarketCategory = 'indices' | 'sectors' | 'commodities' | 'crypto';

// Create initial state
function createInitialState(): MarketsState {
	const emptySection = {
		items: [],
		loading: false,
		error: null,
		lastUpdated: null
	};

	return {
		indices: { ...emptySection },
		sectors: { ...emptySection },
		commodities: { ...emptySection },
		crypto: { ...emptySection },
		initialized: false
	};
}

// Create the store
function createMarketsStore() {
	const { subscribe, set, update } = writable<MarketsState>(createInitialState());

	return {
		subscribe,

		/**
		 * Initialize store
		 */
		init() {
			update((state) => ({ ...state, initialized: true }));
		},

		/**
		 * Set loading state for a category
		 */
		setLoading(category: MarketCategory, loading: boolean) {
			update((state) => ({
				...state,
				[category]: {
					...state[category],
					loading,
					error: loading ? null : state[category].error
				}
			}));
		},

		/**
		 * Set error state for a category
		 */
		setError(category: MarketCategory, error: string | null) {
			update((state) => ({
				...state,
				[category]: {
					...state[category],
					loading: false,
					error
				}
			}));
		},

		/**
		 * Set indices data
		 */
		setIndices(items: MarketItem[]) {
			update((state) => ({
				...state,
				indices: {
					items,
					loading: false,
					error: null,
					lastUpdated: Date.now()
				}
			}));
		},

		/**
		 * Set sectors data
		 */
		setSectors(items: SectorPerformance[]) {
			update((state) => ({
				...state,
				sectors: {
					items,
					loading: false,
					error: null,
					lastUpdated: Date.now()
				}
			}));
		},

		/**
		 * Set commodities data
		 */
		setCommodities(items: MarketItem[]) {
			update((state) => ({
				...state,
				commodities: {
					items,
					loading: false,
					error: null,
					lastUpdated: Date.now()
				}
			}));
		},

		/**
		 * Set crypto data
		 */
		setCrypto(items: CryptoItem[]) {
			update((state) => ({
				...state,
				crypto: {
					items,
					loading: false,
					error: null,
					lastUpdated: Date.now()
				}
			}));
		},

		/**
		 * Update a single market item
		 */
		updateItem(category: 'indices' | 'commodities', symbol: string, updates: Partial<MarketItem>) {
			update((state) => {
				const items = state[category].items as MarketItem[];
				const index = items.findIndex((i) => i.symbol === symbol);
				if (index === -1) return state;

				const newItems = [...items];
				newItems[index] = { ...newItems[index], ...updates };

				return {
					...state,
					[category]: {
						...state[category],
						items: newItems
					}
				};
			});
		},

		/**
		 * Update a single crypto item
		 */
		updateCrypto(id: string, updates: Partial<CryptoItem>) {
			update((state) => {
				const index = state.crypto.items.findIndex((i) => i.id === id);
				if (index === -1) return state;

				const newItems = [...state.crypto.items];
				newItems[index] = { ...newItems[index], ...updates };

				return {
					...state,
					crypto: {
						...state.crypto,
						items: newItems
					}
				};
			});
		},

		/**
		 * Get market summary
		 */
		getSummary(): {
			marketTrend: 'up' | 'down' | 'mixed';
			topGainer: MarketItem | null;
			topLoser: MarketItem | null;
		} {
			const state = get({ subscribe });
			const allItems = [...state.indices.items, ...state.sectors.items, ...state.commodities.items];

			if (allItems.length === 0) {
				return { marketTrend: 'mixed', topGainer: null, topLoser: null };
			}

			const gainers = allItems.filter((i) => i.changePercent > 0);
			const losers = allItems.filter((i) => i.changePercent < 0);

			let marketTrend: 'up' | 'down' | 'mixed' = 'mixed';
			if (gainers.length > losers.length * 1.5) {
				marketTrend = 'up';
			} else if (losers.length > gainers.length * 1.5) {
				marketTrend = 'down';
			}

			const sorted = [...allItems].sort((a, b) => b.changePercent - a.changePercent);
			const topGainer = sorted[0] ?? null;
			const topLoser = sorted[sorted.length - 1] ?? null;

			return { marketTrend, topGainer, topLoser };
		},

		/**
		 * Check if any category is loading
		 */
		isAnyLoading(): boolean {
			const state = get({ subscribe });
			return (
				state.indices.loading ||
				state.sectors.loading ||
				state.commodities.loading ||
				state.crypto.loading
			);
		},

		/**
		 * Clear all data
		 */
		clearAll() {
			set(createInitialState());
		}
	};
}

// Export singleton store
export const markets = createMarketsStore();

// Derived stores
export const indices = derived(markets, ($markets) => $markets.indices);
export const sectors = derived(markets, ($markets) => $markets.sectors);
export const commodities = derived(markets, ($markets) => $markets.commodities);
export const crypto = derived(markets, ($markets) => $markets.crypto);

// Market status derived stores
export const isMarketsLoading = derived(
	markets,
	($markets) =>
		$markets.indices.loading ||
		$markets.sectors.loading ||
		$markets.commodities.loading ||
		$markets.crypto.loading
);

export const marketsLastUpdated = derived(markets, ($markets) => {
	const times = [
		$markets.indices.lastUpdated,
		$markets.sectors.lastUpdated,
		$markets.commodities.lastUpdated,
		$markets.crypto.lastUpdated
	].filter((t): t is number => t !== null);

	return times.length > 0 ? Math.max(...times) : null;
});

// VIX convenience store (commonly needed)
export const vix = derived(markets, ($markets) => {
	return $markets.commodities.items.find((i) => i.symbol === '^VIX') ?? null;
});
