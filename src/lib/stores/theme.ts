import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'dark';

const THEME_KEY = 'situation-monitor-theme';

function createThemeStore() {
	// Force dark theme and override any stored value
	const initialTheme: Theme = 'dark';
	const { subscribe, set } = writable<Theme>(initialTheme);

	function applyTheme(theme: Theme) {
		if (browser) {
			document.documentElement.setAttribute('data-theme', theme);
			localStorage.setItem(THEME_KEY, theme);
		}
	}

	if (browser) {
		applyTheme(initialTheme);
	}

	return {
		subscribe,
		setTheme: () => {
			set(initialTheme);
			applyTheme(initialTheme);
		},
		toggle: () => {
			set(initialTheme);
			applyTheme(initialTheme);
		}
	};
}

export const theme = createThemeStore();
