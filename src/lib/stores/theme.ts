import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'dark' | 'light';

const THEME_KEY = 'situation-monitor-theme';

function createThemeStore() {
	// Get initial theme from localStorage or default to dark
	const initialTheme: Theme = browser
		? (localStorage.getItem(THEME_KEY) as Theme) || 'dark'
		: 'dark';

	const { subscribe, set } = writable<Theme>(initialTheme);

	// Apply theme to document
	function applyTheme(theme: Theme) {
		if (browser) {
			document.documentElement.setAttribute('data-theme', theme);
			localStorage.setItem(THEME_KEY, theme);
		}
	}

	// Initialize theme on load
	if (browser) {
		applyTheme(initialTheme);
	}

	return {
		subscribe,
		setTheme: (theme: Theme) => {
			set(theme);
			applyTheme(theme);
		},
		toggle: () => {
			const newTheme = browser && document.documentElement.getAttribute('data-theme') === 'light' 
				? 'dark' 
				: 'light';
			set(newTheme);
			applyTheme(newTheme);
		}
	};
}

export const theme = createThemeStore();
