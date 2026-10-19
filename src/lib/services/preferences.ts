import { writable } from 'svelte/store';
import type { Preferences } from '$lib/account';

export const preferenceSync = writable<'saved' | 'saving' | 'error'>('saved');
let values: Preferences = {};
let pending: Preferences = {};
let timer: ReturnType<typeof setTimeout> | undefined;
let inFlight: Promise<boolean> | undefined;

export function initializePreferences(preferences: Preferences) {
	values = structuredClone(preferences);
	pending = {};
	preferenceSync.set('saved');
}

function schedule() {
	preferenceSync.set('saving');
	clearTimeout(timer);
	timer = setTimeout(() => void flushPreferences(), 500);
}

export async function flushPreferences(): Promise<boolean> {
	clearTimeout(timer);
	if (inFlight) {
		if (!(await inFlight)) return false;
		return flushPreferences();
	}
	if (Object.keys(pending).length === 0) return true;
	const patch = pending;
	pending = {};
	preferenceSync.set('saving');
	inFlight = (async () => {
		try {
			const response = await fetch('/api/account/preferences', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(patch),
				keepalive: true
			});
			if (!response.ok) throw new Error('Preferences could not be saved');
			preferenceSync.set(Object.keys(pending).length ? 'saving' : 'saved');
			return true;
		} catch {
			pending = { ...patch, ...pending };
			preferenceSync.set('error');
			return false;
		} finally {
			inFlight = undefined;
		}
	})();
	const saved = await inFlight;
	if (saved && Object.keys(pending).length) return flushPreferences();
	return saved;
}

// Storage interface retained for the dashboard stores. Account data is held in
// memory and saved to the authenticated server, never browser-wide localStorage.
export const preferenceStorage = {
	getItem(key: string): string | null {
		return Object.hasOwn(values, key) ? JSON.stringify(values[key]) : null;
	},
	setItem(key: string, value: string) {
		values[key] = JSON.parse(value);
		pending[key] = values[key];
		schedule();
	},
	removeItem(key: string) {
		delete values[key];
		pending[key] = null;
		schedule();
	}
};
