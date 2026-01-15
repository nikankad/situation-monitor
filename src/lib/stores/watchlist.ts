/**
 * Watchlist store - user-customizable list of stocks and crypto to track
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'situation-monitor-watchlist';

export interface WatchlistItem {
	symbol: string;
	name: string;
	type: 'stock' | 'crypto';
}

export interface WatchlistState {
	items: WatchlistItem[];
}

// Default watchlist items
const DEFAULT_STOCKS: WatchlistItem[] = [
	{ symbol: 'AAPL', name: 'Apple', type: 'stock' },
	{ symbol: 'MSFT', name: 'Microsoft', type: 'stock' },
	{ symbol: 'GOOGL', name: 'Google', type: 'stock' },
	{ symbol: 'AMZN', name: 'Amazon', type: 'stock' },
	{ symbol: 'NVDA', name: 'NVIDIA', type: 'stock' },
	{ symbol: 'TSLA', name: 'Tesla', type: 'stock' }
];

const DEFAULT_CRYPTO: WatchlistItem[] = [
	{ symbol: 'bitcoin', name: 'Bitcoin', type: 'crypto' },
	{ symbol: 'ethereum', name: 'Ethereum', type: 'crypto' },
	{ symbol: 'solana', name: 'Solana', type: 'crypto' }
];

function createInitialState(): WatchlistState {
	return {
		items: [...DEFAULT_STOCKS, ...DEFAULT_CRYPTO]
	};
}

function loadFromStorage(): WatchlistState | null {
	if (!browser) return null;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (e) {
		console.warn('Failed to load watchlist from localStorage:', e);
	}
	return null;
}

function saveToStorage(state: WatchlistState) {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (e) {
		console.warn('Failed to save watchlist to localStorage:', e);
	}
}

function createWatchlistStore() {
	const initial = loadFromStorage() ?? createInitialState();
	const { subscribe, set, update } = writable<WatchlistState>(initial);

	return {
		subscribe,

		/**
		 * Add item to watchlist
		 */
		addItem(item: WatchlistItem) {
			update((state) => {
				// Check for duplicates
				const exists = state.items.some(
					(i) => i.symbol.toLowerCase() === item.symbol.toLowerCase() && i.type === item.type
				);
				if (exists) return state;

				const newState = {
					items: [...state.items, item]
				};
				saveToStorage(newState);
				return newState;
			});
		},

		/**
		 * Remove item from watchlist
		 */
		removeItem(symbol: string, type: 'stock' | 'crypto') {
			update((state) => {
				const newState = {
					items: state.items.filter(
						(i) => !(i.symbol.toLowerCase() === symbol.toLowerCase() && i.type === type)
					)
				};
				saveToStorage(newState);
				return newState;
			});
		},

		/**
		 * Check if item is in watchlist
		 */
		hasItem(symbol: string, type: 'stock' | 'crypto'): boolean {
			const state = get({ subscribe });
			return state.items.some(
				(i) => i.symbol.toLowerCase() === symbol.toLowerCase() && i.type === type
			);
		},

		/**
		 * Reset to default watchlist
		 */
		reset() {
			const newState = createInitialState();
			set(newState);
			saveToStorage(newState);
		},

		/**
		 * Get stocks only
		 */
		getStocks(): WatchlistItem[] {
			return get({ subscribe }).items.filter((i) => i.type === 'stock');
		},

		/**
		 * Get crypto only
		 */
		getCrypto(): WatchlistItem[] {
			return get({ subscribe }).items.filter((i) => i.type === 'crypto');
		}
	};
}

export const watchlist = createWatchlistStore();

// Derived stores
export const watchlistStocks = derived(watchlist, ($watchlist) =>
	$watchlist.items.filter((i) => i.type === 'stock')
);

export const watchlistCrypto = derived(watchlist, ($watchlist) =>
	$watchlist.items.filter((i) => i.type === 'crypto')
);

export const watchlistCount = derived(watchlist, ($watchlist) => $watchlist.items.length);
