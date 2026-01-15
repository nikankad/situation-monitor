/**
 * Market settings store - which markets to display and their order
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { INDICES, SECTORS, COMMODITIES, CRYPTO } from '$lib/config/markets';

const STORAGE_KEY = 'marketSettings';
const CUSTOM_MARKETS_KEY = 'customMarkets';

export interface MarketDisplaySettings {
	indices: {
		enabled: string[]; // symbol array
		order: string[];
	};
	sectors: {
		enabled: string[];
		order: string[];
	};
	commodities: {
		enabled: string[];
		order: string[];
	};
	crypto: {
		enabled: string[];
		order: string[];
	};
	custom: {
		enabled: string[];
		order: string[];
	};
}

export interface CustomMarket {
	symbol: string;
	name: string;
}

function getDefaultSettings(): MarketDisplaySettings {
	return {
		indices: {
			enabled: INDICES.map((i) => i.symbol),
			order: INDICES.map((i) => i.symbol)
		},
		sectors: {
			enabled: SECTORS.map((s) => s.symbol),
			order: SECTORS.map((s) => s.symbol)
		},
		commodities: {
			enabled: COMMODITIES.map((c) => c.symbol),
			order: COMMODITIES.map((c) => c.symbol)
		},
		crypto: {
			enabled: CRYPTO.map((c) => c.symbol),
			order: CRYPTO.map((c) => c.symbol)
		},
		custom: {
			enabled: [],
			order: []
		}
	};
}

// Custom markets store (symbol -> name mapping)
function loadCustomMarkets(): Map<string, string> {
	if (!browser) return new Map();
	try {
		const saved = localStorage.getItem(CUSTOM_MARKETS_KEY);
		if (saved) {
			const arr: CustomMarket[] = JSON.parse(saved);
			return new Map(arr.map((m) => [m.symbol, m.name]));
		}
	} catch (e) {
		console.warn('Failed to load custom markets:', e);
	}
	return new Map();
}

function saveCustomMarkets(markets: Map<string, string>): void {
	if (!browser) return;
	try {
		const arr: CustomMarket[] = Array.from(markets.entries()).map(([symbol, name]) => ({
			symbol,
			name
		}));
		localStorage.setItem(CUSTOM_MARKETS_KEY, JSON.stringify(arr));
	} catch (e) {
		console.warn('Failed to save custom markets:', e);
	}
}

// Writable store for custom markets
const customMarketsMap = writable<Map<string, string>>(loadCustomMarkets());

export const customMarkets = {
	subscribe: customMarketsMap.subscribe,
	add(symbol: string, name: string) {
		customMarketsMap.update((m) => {
			m.set(symbol.toUpperCase(), name);
			saveCustomMarkets(m);
			return new Map(m);
		});
	},
	remove(symbol: string) {
		customMarketsMap.update((m) => {
			m.delete(symbol.toUpperCase());
			saveCustomMarkets(m);
			return new Map(m);
		});
	},
	getName(symbol: string): string {
		return get(customMarketsMap).get(symbol.toUpperCase()) || symbol;
	}
};

/**
 * Validate and clean saved settings - remove symbols that no longer exist in config
 */
function cleanSavedSettings(saved: Partial<MarketDisplaySettings>): Partial<MarketDisplaySettings> {
	const validSymbols = {
		indices: new Set(INDICES.map((i) => i.symbol)),
		sectors: new Set(SECTORS.map((s) => s.symbol)),
		commodities: new Set(COMMODITIES.map((c) => c.symbol)),
		crypto: new Set(CRYPTO.map((c) => c.symbol))
	};

	const cleaned: Partial<MarketDisplaySettings> = {};

	if (saved.indices) {
		cleaned.indices = {
			enabled: (saved.indices.enabled || []).filter((s) => validSymbols.indices.has(s)),
			order: (saved.indices.order || []).filter((s) => validSymbols.indices.has(s))
		};
	}

	if (saved.sectors) {
		cleaned.sectors = {
			enabled: (saved.sectors.enabled || []).filter((s) => validSymbols.sectors.has(s)),
			order: (saved.sectors.order || []).filter((s) => validSymbols.sectors.has(s))
		};
	}

	if (saved.commodities) {
		cleaned.commodities = {
			enabled: (saved.commodities.enabled || []).filter((s) => validSymbols.commodities.has(s)),
			order: (saved.commodities.order || []).filter((s) => validSymbols.commodities.has(s))
		};
	}

	if (saved.crypto) {
		cleaned.crypto = {
			enabled: (saved.crypto.enabled || []).filter((s) => validSymbols.crypto.has(s)),
			order: (saved.crypto.order || []).filter((s) => validSymbols.crypto.has(s))
		};
	}

	return cleaned;
}

function loadFromStorage(): Partial<MarketDisplaySettings> {
	if (!browser) return {};

	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		return saved ? JSON.parse(saved) : {};
	} catch (e) {
		console.warn('Failed to load market settings from localStorage:', e);
		return {};
	}
}

function saveToStorage(settings: MarketDisplaySettings): void {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch (e) {
		console.warn('Failed to save market settings to localStorage:', e);
	}
}

function createMarketSettingsStore() {
	const defaults = getDefaultSettings();
	const saved = loadFromStorage();
	const cleanedSaved = cleanSavedSettings(saved);

	const initialSettings: MarketDisplaySettings = {
		indices: {
			enabled: cleanedSaved.indices?.enabled ?? defaults.indices.enabled,
			order: cleanedSaved.indices?.order ?? defaults.indices.order
		},
		sectors: {
			enabled: cleanedSaved.sectors?.enabled ?? defaults.sectors.enabled,
			order: cleanedSaved.sectors?.order ?? defaults.sectors.order
		},
		commodities: {
			enabled: cleanedSaved.commodities?.enabled ?? defaults.commodities.enabled,
			order: cleanedSaved.commodities?.order ?? defaults.commodities.order
		},
		crypto: {
			enabled: cleanedSaved.crypto?.enabled ?? defaults.crypto.enabled,
			order: cleanedSaved.crypto?.order ?? defaults.crypto.order
		},
		custom: {
			enabled: (saved as any).custom?.enabled ?? defaults.custom.enabled,
			order: (saved as any).custom?.order ?? defaults.custom.order
		}
	};

	const { subscribe, set, update } = writable<MarketDisplaySettings>(initialSettings);
	let currentSettings = initialSettings;

	subscribe((value) => {
		currentSettings = value;
	});

	return {
		subscribe,

		/**
		 * Toggle market visibility
		 */
		toggleMarket(category: keyof MarketDisplaySettings, symbol: string) {
			update((settings) => {
				const categorySettings = settings[category];
				const index = categorySettings.enabled.indexOf(symbol);

				if (index > -1) {
					categorySettings.enabled.splice(index, 1);
				} else {
					categorySettings.enabled.push(symbol);
				}

				saveToStorage(settings);
				return settings;
			});
		},

		/**
		 * Reorder markets
		 */
		reorderMarkets(category: keyof MarketDisplaySettings, newOrder: string[]) {
			update((settings) => {
				settings[category].order = newOrder;
				saveToStorage(settings);
				return settings;
			});
		},

		/**
		 * Reset to defaults
		 */
		reset() {
			const defaults = getDefaultSettings();
			set(defaults);
			saveToStorage(defaults);
		},

		/**
		 * Get enabled and sorted markets for a category
		 */
		getOrderedMarkets(category: keyof MarketDisplaySettings): string[] {
			const categorySettings = currentSettings[category];
			return categorySettings.order.filter((symbol: string) =>
				categorySettings.enabled.includes(symbol)
			);
		},

		/**
		 * Add a custom market
		 */
		addCustomMarket(symbol: string, name: string) {
			const upperSymbol = symbol.toUpperCase();
			customMarkets.add(upperSymbol, name);
			update((settings) => {
				if (!settings.custom.order.includes(upperSymbol)) {
					settings.custom.order.push(upperSymbol);
					settings.custom.enabled.push(upperSymbol);
				}
				saveToStorage(settings);
				return settings;
			});
		},

		/**
		 * Remove a custom market
		 */
		removeCustomMarket(symbol: string) {
			const upperSymbol = symbol.toUpperCase();
			customMarkets.remove(upperSymbol);
			update((settings) => {
				settings.custom.order = settings.custom.order.filter((s) => s !== upperSymbol);
				settings.custom.enabled = settings.custom.enabled.filter((s) => s !== upperSymbol);
				saveToStorage(settings);
				return settings;
			});
		}
	};
}

export const marketSettings = createMarketSettingsStore();
