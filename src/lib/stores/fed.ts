/**
 * Federal Reserve store - manages Fed news and economic indicators
 */

import { writable, derived } from 'svelte/store';
import type { FedIndicators, FedNewsItem } from '$lib/api/fred';

// ============================================================================
// State Types
// ============================================================================

export interface FedIndicatorsState {
	data: FedIndicators | null;
	loading: boolean;
	error: string | null;
	lastUpdated: number | null;
}

export interface FedNewsState {
	items: FedNewsItem[];
	loading: boolean;
	error: string | null;
	lastUpdated: number | null;
}

// ============================================================================
// Indicators Store
// ============================================================================

function createFedIndicatorsStore() {
	const { subscribe, update } = writable<FedIndicatorsState>({
		data: null,
		loading: false,
		error: null,
		lastUpdated: null
	});

	return {
		subscribe,

		setLoading(loading: boolean) {
			update((state) => ({
				...state,
				loading,
				error: loading ? null : state.error
			}));
		},

		setError(error: string | null) {
			update((state) => ({
				...state,
				loading: false,
				error
			}));
		},

		setData(data: FedIndicators) {
			update(() => ({
				data,
				loading: false,
				error: null,
				lastUpdated: Date.now()
			}));
		}
	};
}

export const fedIndicators = createFedIndicatorsStore();

// ============================================================================
// News Store
// ============================================================================

function createFedNewsStore() {
	const { subscribe, update } = writable<FedNewsState>({
		items: [],
		loading: false,
		error: null,
		lastUpdated: null
	});

	return {
		subscribe,

		setLoading(loading: boolean) {
			update((state) => ({
				...state,
				loading,
				error: loading ? null : state.error
			}));
		},

		setError(error: string | null) {
			update((state) => ({
				...state,
				loading: false,
				error
			}));
		},

		setItems(items: FedNewsItem[]) {
			update(() => ({
				items,
				loading: false,
				error: null,
				lastUpdated: Date.now()
			}));
		}
	};
}

export const fedNews = createFedNewsStore();

// ============================================================================
// Derived Stores
// ============================================================================

export const isFedLoading = derived(
	[fedIndicators, fedNews],
	([$indicators, $news]) => $indicators.loading || $news.loading
);

export const fedVideos = derived(fedNews, ($news) => $news.items.filter((item) => item.hasVideo));
