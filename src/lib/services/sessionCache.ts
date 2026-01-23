/**
 * Session cache - stores and retrieves last session's data for faster loads
 */

import type { NewsItem, NewsCategory } from '$lib/types';
import type { MarketItem, CryptoItem, SectorPerformance } from '$lib/types';

const CACHE_VERSION = 1;
const NEWS_CACHE_KEY = 'session_news_v' + CACHE_VERSION;
const MARKETS_CACHE_KEY = 'session_markets_v' + CACHE_VERSION;
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedNews {
	timestamp: number;
	data: Record<NewsCategory, NewsItem[]>;
}

export interface CachedMarkets {
	timestamp: number;
	data: {
		indices: MarketItem[];
		sectors: SectorPerformance[];
		commodities: MarketItem[];
		crypto: CryptoItem[];
		custom: MarketItem[];
	};
}

/**
 * Check if cache is still valid
 */
function isCacheValid(timestamp: number): boolean {
	return Date.now() - timestamp < CACHE_EXPIRY_MS;
}

/**
 * Load cached news from localStorage
 */
export function loadCachedNews(): CachedNews | null {
	try {
		const cached = localStorage.getItem(NEWS_CACHE_KEY);
		if (!cached) return null;

		const parsed = JSON.parse(cached);
		if (!isCacheValid(parsed.timestamp)) {
			// Cache expired, clear it
			localStorage.removeItem(NEWS_CACHE_KEY);
			return null;
		}

		return parsed;
	} catch (error) {
		console.warn('Failed to load cached news:', error);
		return null;
	}
}

/**
 * Load cached markets from localStorage
 */
export function loadCachedMarkets(): CachedMarkets | null {
	try {
		const cached = localStorage.getItem(MARKETS_CACHE_KEY);
		if (!cached) return null;

		const parsed = JSON.parse(cached);
		if (!isCacheValid(parsed.timestamp)) {
			// Cache expired, clear it
			localStorage.removeItem(MARKETS_CACHE_KEY);
			return null;
		}

		return parsed;
	} catch (error) {
		console.warn('Failed to load cached markets:', error);
		return null;
	}
}

/**
 * Save news to cache
 */
export function saveCachedNews(data: Record<NewsCategory, NewsItem[]>): void {
	try {
		const toCache: CachedNews = {
			timestamp: Date.now(),
			data
		};
		localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(toCache));
	} catch (error) {
		console.warn('Failed to save news cache:', error);
	}
}

/**
 * Save markets to cache
 */
export function saveCachedMarkets(data: {
	indices: MarketItem[];
	sectors: SectorPerformance[];
	commodities: MarketItem[];
	crypto: CryptoItem[];
	custom: MarketItem[];
}): void {
	try {
		const toCache: CachedMarkets = {
			timestamp: Date.now(),
			data
		};
		localStorage.setItem(MARKETS_CACHE_KEY, JSON.stringify(toCache));
	} catch (error) {
		console.warn('Failed to save markets cache:', error);
	}
}

/**
 * Clear all session caches
 */
export function clearSessionCache(): void {
	try {
		localStorage.removeItem(NEWS_CACHE_KEY);
		localStorage.removeItem(MARKETS_CACHE_KEY);
	} catch (error) {
		console.warn('Failed to clear session cache:', error);
	}
}
