/**
 * Monitors store - custom user monitors CRUD
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { CustomMonitor, NewsItem } from '$lib/types';

const STORAGE_KEY = 'customMonitors';
const MAX_MONITORS = 20;

export interface MonitorMatch {
	monitor: CustomMonitor;
	item: NewsItem;
	matchedKeywords: string[];
}

export interface MonitorsState {
	monitors: CustomMonitor[];
	matches: MonitorMatch[];
	initialized: boolean;
}

// Load monitors from localStorage
function loadMonitors(): CustomMonitor[] {
	if (!browser) return [];

	try {
		const data = localStorage.getItem(STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	} catch (e) {
		console.warn('Failed to load monitors from localStorage:', e);
		return [];
	}
}

// Save monitors to localStorage
function saveMonitors(monitors: CustomMonitor[]): void {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(monitors));
	} catch (e) {
		console.warn('Failed to save monitors to localStorage:', e);
	}
}

// Generate a unique ID
function generateId(): string {
	return `mon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Create the store
function createMonitorsStore() {
	const initialState: MonitorsState = {
		monitors: loadMonitors(),
		matches: [],
		initialized: false
	};

	const { subscribe, set, update } = writable<MonitorsState>(initialState);

	return {
		subscribe,

		/**
		 * Initialize store (call after hydration)
		 */
		init() {
			update((state) => ({ ...state, initialized: true }));
		},

		/**
		 * Get all monitors
		 */
		getMonitors(): CustomMonitor[] {
			return get({ subscribe }).monitors;
		},

		/**
		 * Get a specific monitor by ID
		 */
		getMonitor(id: string): CustomMonitor | undefined {
			return get({ subscribe }).monitors.find((m) => m.id === id);
		},

		/**
		 * Add a new monitor
		 */
		addMonitor(
			monitor: Omit<CustomMonitor, 'id' | 'createdAt' | 'matchCount'>
		): CustomMonitor | null {
			const state = get({ subscribe });

			if (state.monitors.length >= MAX_MONITORS) {
				console.warn(`Maximum monitors (${MAX_MONITORS}) reached`);
				return null;
			}

			const newMonitor: CustomMonitor = {
				...monitor,
				id: generateId(),
				createdAt: Date.now(),
				matchCount: 0
			};

			update((s) => {
				const newMonitors = [...s.monitors, newMonitor];
				saveMonitors(newMonitors);
				return { ...s, monitors: newMonitors };
			});

			return newMonitor;
		},

		/**
		 * Update an existing monitor
		 */
		updateMonitor(id: string, updates: Partial<Omit<CustomMonitor, 'id' | 'createdAt'>>): boolean {
			let found = false;

			update((state) => {
				const index = state.monitors.findIndex((m) => m.id === id);
				if (index === -1) return state;

				found = true;
				const newMonitors = [...state.monitors];
				newMonitors[index] = { ...newMonitors[index], ...updates };
				saveMonitors(newMonitors);
				return { ...state, monitors: newMonitors };
			});

			return found;
		},

		/**
		 * Delete a monitor
		 */
		deleteMonitor(id: string): boolean {
			let found = false;

			update((state) => {
				const index = state.monitors.findIndex((m) => m.id === id);
				if (index === -1) return state;

				found = true;
				const newMonitors = state.monitors.filter((m) => m.id !== id);
				const newMatches = state.matches.filter((m) => m.monitor.id !== id);
				saveMonitors(newMonitors);
				return { ...state, monitors: newMonitors, matches: newMatches };
			});

			return found;
		},

		/**
		 * Toggle monitor enabled state
		 */
		toggleMonitor(id: string): void {
			update((state) => {
				const index = state.monitors.findIndex((m) => m.id === id);
				if (index === -1) return state;

				const newMonitors = [...state.monitors];
				newMonitors[index] = {
					...newMonitors[index],
					enabled: !newMonitors[index].enabled
				};
				saveMonitors(newMonitors);
				return { ...state, monitors: newMonitors };
			});
		},

		/**
		 * Scan news items for monitor matches
		 */
		scanForMatches(newsItems: NewsItem[]): MonitorMatch[] {
			const state = get({ subscribe });
			const matches: MonitorMatch[] = [];

			for (const monitor of state.monitors) {
				if (!monitor.enabled) continue;

				for (const item of newsItems) {
					const textToSearch = `${item.title} ${item.description || ''}`.toLowerCase();
					const matchedKeywords: string[] = [];

					for (const keyword of monitor.keywords) {
						if (textToSearch.includes(keyword.toLowerCase())) {
							matchedKeywords.push(keyword);
						}
					}

					if (matchedKeywords.length > 0) {
						matches.push({ monitor, item, matchedKeywords });
					}
				}
			}

			// Update match counts and store matches
			update((s) => {
				const newMonitors = s.monitors.map((m) => ({
					...m,
					matchCount: matches.filter((match) => match.monitor.id === m.id).length
				}));
				saveMonitors(newMonitors);
				return { ...s, monitors: newMonitors, matches };
			});

			return matches;
		},

		/**
		 * Clear all matches
		 */
		clearMatches(): void {
			update((state) => ({ ...state, matches: [] }));
		},

		/**
		 * Reset all monitors
		 */
		reset(): void {
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
			set({ monitors: [], matches: [], initialized: true });
		}
	};
}

// Export singleton store
export const monitors = createMonitorsStore();

// Derived stores
export const enabledMonitors = derived(monitors, ($monitors) =>
	$monitors.monitors.filter((m) => m.enabled)
);

export const monitorCount = derived(monitors, ($monitors) => $monitors.monitors.length);

export const matchCount = derived(monitors, ($monitors) => $monitors.matches.length);

export const hasMatches = derived(monitors, ($monitors) => $monitors.matches.length > 0);
