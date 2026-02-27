/**
 * Keywords store - manage custom alert keywords
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { ALERT_KEYWORDS } from '$lib/config/keywords';

const STORAGE_KEY = 'situationMonitorCustomKeywords';

export interface KeywordsState {
	custom: string[];
	enabled: boolean; // Whether to use custom keywords instead of defaults
}

// Load from localStorage
function loadFromStorage(): Partial<KeywordsState> {
	if (!browser) return {};

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : {};
	} catch (e) {
		console.warn('Failed to load custom keywords from localStorage:', e);
		return {};
	}
}

// Save to localStorage
function saveToStorage(state: KeywordsState): void {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (e) {
		console.warn('Failed to save custom keywords to localStorage:', e);
	}
}

// Create the store
function createKeywordsStore() {
	const saved = loadFromStorage();
	const initialState: KeywordsState = {
		custom: saved.custom ?? Array.from(ALERT_KEYWORDS),
		enabled: saved.enabled ?? false
	};

	const { subscribe, set, update } = writable<KeywordsState>(initialState);

	return {
		subscribe,

		/**
		 * Get active keywords (custom if enabled, defaults otherwise)
		 */
		getActiveKeywords(): string[] {
			const state = get({ subscribe });
			return state.enabled ? state.custom : Array.from(ALERT_KEYWORDS);
		},

		/**
		 * Set custom keywords
		 */
		setCustomKeywords(keywords: string[]) {
			update((state) => {
				const newState = { ...state, custom: keywords };
				saveToStorage(newState);
				return newState;
			});
		},

		/**
		 * Add a keyword
		 */
		addKeyword(keyword: string) {
			update((state) => {
				const trimmed = keyword.trim().toLowerCase();
				if (!trimmed || state.custom.includes(trimmed)) return state;
				
				const newState = { ...state, custom: [...state.custom, trimmed] };
				saveToStorage(newState);
				return newState;
			});
		},

		/**
		 * Remove a keyword
		 */
		removeKeyword(keyword: string) {
			update((state) => {
				const newState = {
					...state,
					custom: state.custom.filter((k) => k !== keyword)
				};
				saveToStorage(newState);
				return newState;
			});
		},

		/**
		 * Toggle between custom and default keywords
		 */
		toggleEnabled() {
			update((state) => {
				const newState = { ...state, enabled: !state.enabled };
				saveToStorage(newState);
				return newState;
			});
		},

		/**
		 * Reset to default keywords
		 */
		reset() {
			const newState: KeywordsState = {
				custom: Array.from(ALERT_KEYWORDS),
				enabled: false
			};
			set(newState);
			saveToStorage(newState);
		}
	};
}

// Export singleton store
export const keywordsStore = createKeywordsStore();
