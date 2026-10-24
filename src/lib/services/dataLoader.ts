/**
 * Data loader - fetches news, markets and secondary data for every route and keeps it fresh
 */

import { get } from 'svelte/store';
import {
	fetchAllNews,
	fetchAllMarkets,
	fetchCustomMarkets,
	fetchPolymarket,
	fetchGovContracts
} from '$lib/api';
import { news } from '$lib/stores/news';
import { markets } from '$lib/stores/markets';
import { refresh } from '$lib/stores/refresh';
import { customMarkets } from '$lib/stores/market-settings';
import { predictions, contracts, miscLoading, appReady } from '$lib/stores/misc';
import type { MarketItem, NewsCategory, NewsItem } from '$lib/types';
import {
	loadCachedNews,
	loadCachedMarkets,
	saveCachedNews,
	saveCachedMarkets
} from './sessionCache';

const NEWS_CATEGORIES: NewsCategory[] = ['politics', 'tech', 'finance', 'gov', 'ai', 'intel'];
/** Show the app after this long even if the first load failed */
const FALLBACK_READY_MS = 5000;
/** Let the first render finish before loading secondary data */
const SECONDARY_STAGE_DELAY_MS = 100;

async function loadNews(): Promise<void> {
	NEWS_CATEGORIES.forEach((cat) => news.setLoading(cat, true));

	const applyNews = (data: Record<NewsCategory, NewsItem[]>) => {
		(Object.keys(data) as NewsCategory[]).forEach((category) => {
			news.setItems(category, data[category]);
		});
		saveCachedNews(data);
	};

	try {
		// RSS results come back first; slower, rate-limited GDELT results follow via the callback
		applyNews(await fetchAllNews(applyNews));
	} catch (error) {
		NEWS_CATEGORIES.forEach((cat) => news.setError(cat, String(error)));
	}
}

async function loadCustomMarkets(): Promise<MarketItem[]> {
	try {
		const customSymbols = Array.from(get(customMarkets).entries()).map(([symbol, name]) => ({
			symbol,
			name
		}));

		if (customSymbols.length === 0) {
			markets.setCustom([]);
			return [];
		}

		const customData = await fetchCustomMarkets(customSymbols);
		markets.setCustom(customData);
		return customData;
	} catch (error) {
		console.error('Failed to load custom markets:', error);
		return [];
	}
}

async function loadMarkets(): Promise<void> {
	try {
		const data = await fetchAllMarkets();
		markets.setIndices(data.indices);
		markets.setSectors(data.sectors);
		markets.setCommodities(data.commodities);
		markets.setCrypto(data.crypto);

		const customMarketsData = await loadCustomMarkets();

		saveCachedMarkets({
			indices: data.indices,
			sectors: data.sectors,
			commodities: data.commodities,
			crypto: data.crypto,
			custom: customMarketsData
		});
	} catch (error) {
		console.error('Failed to load markets:', error);
	}
}

async function loadMiscData(): Promise<void> {
	try {
		const [predictionsData, contractsData] = await Promise.all([
			fetchPolymarket(),
			fetchGovContracts()
		]);
		predictions.set(predictionsData);
		contracts.set(contractsData);
	} catch (error) {
		console.error('Failed to load misc data:', error);
	} finally {
		miscLoading.set(false);
	}
}

export async function refreshAll(): Promise<void> {
	refresh.startRefresh();
	try {
		await Promise.all([loadNews(), loadMarkets(), loadMiscData()]);
		refresh.endRefresh();
	} catch (error) {
		refresh.endRefresh([String(error)]);
	}
}

/** Show cached data from the last visit straight away */
function applySessionCache(): void {
	const cachedNews = loadCachedNews();
	const cachedMarkets = loadCachedMarkets();

	if (cachedNews) {
		Object.entries(cachedNews.data).forEach(([category, items]) => {
			news.setItems(category as NewsCategory, items);
		});
	}

	if (cachedMarkets) {
		markets.setIndices(cachedMarkets.data.indices);
		markets.setSectors(cachedMarkets.data.sectors);
		markets.setCommodities(cachedMarkets.data.commodities);
		markets.setCrypto(cachedMarkets.data.crypto);
		markets.setCustom(cachedMarkets.data.custom);
	}
}

async function initialLoad(): Promise<void> {
	refresh.startRefresh();
	const errors: string[] = [];

	try {
		applySessionCache();

		// Critical stage: news and markets
		try {
			await Promise.all([loadNews(), loadMarkets()]);
		} catch (error) {
			errors.push(`Critical stage error: ${String(error)}`);
		}

		appReady.set(true);

		// Secondary stage runs after the UI is visible
		setTimeout(async () => {
			try {
				await loadMiscData();
			} catch (error) {
				errors.push(`Secondary stage error: ${String(error)}`);
			}
		}, SECONDARY_STAGE_DELAY_MS);

		refresh.endRefresh(errors);
	} catch (error) {
		errors.push(String(error));
		refresh.endRefresh(errors);
		setTimeout(() => appReady.set(true), FALLBACK_READY_MS);
	}
}

/**
 * Start loading data and refreshing it on a timer. Returns a function that stops both.
 */
export function startDataLoading(): () => void {
	void initialLoad();
	refresh.setupAutoRefresh(refreshAll);

	// Reload custom markets when the user adds or removes one
	let previousSize = 0;
	const unsubscribe = customMarkets.subscribe((current) => {
		if (previousSize !== 0 && current.size !== previousSize) void loadCustomMarkets();
		previousSize = current.size;
	});

	return () => {
		refresh.stopAutoRefresh();
		unsubscribe();
	};
}
