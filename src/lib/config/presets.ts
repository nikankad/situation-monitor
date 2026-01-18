/**
 * Onboarding presets for first-time users
 */

import type { PanelId } from './panels';

export interface Preset {
	id: string;
	name: string;
	icon: string;
	description: string;
	panels: PanelId[];
}

export const PRESETS: Record<string, Preset> = {
	'news-junkie': {
		id: 'news-junkie',
		name: 'News Junkie',
		icon: '📰',
		description: 'Stay on top of breaking news across politics, tech, and finance',
		panels: ['politics', 'tech', 'finance', 'gov', 'map']
	},
	trader: {
		id: 'trader',
		name: 'Trader',
		icon: '📈',
		description: 'Market-focused dashboard with stocks, crypto, and commodities',
		panels: [
			'markets',
			'heatmap',
			'commodities',
			'crypto',
			'polymarket',
			'whales',
			'printer',
			'finance',
			'map'
		]
	},
	geopolitics: {
		id: 'geopolitics',
		name: 'Geopolitics Watcher',
		icon: '🌍',
		description: 'Global situation awareness and regional hotspots',
		panels: [
			'map',
			'politics',
			'gov',
			'venezuela',
			'greenland',
			'iran',
			'correlation',
			'narrative'
		]
	},
	minimal: {
		id: 'minimal',
		name: 'Minimal',
		icon: '⚡',
		description: 'Just the essentials - map, news, and markets',
		panels: ['map', 'politics', 'markets']
	},
	everything: {
		id: 'everything',
		name: 'Everything',
		icon: '🎛️',
		description: 'Kitchen sink - all panels enabled',
		panels: [
			'map',
			'politics',
			'tech',
			'finance',
			'gov',
			'heatmap',
			'markets',
			'commodities',
			'crypto',
			'polymarket',
			'whales',
			'printer',
			'contracts',
			'layoffs',
			'venezuela',
			'greenland',
			'iran',
			'correlation',
			'narrative'
		]
	}
};

export const PRESET_ORDER = [
	'news-junkie',
	'trader',
	'geopolitics',
	'minimal',
	'everything'
];

// Storage keys
export const ONBOARDING_STORAGE_KEY = 'onboardingComplete';
export const PRESET_STORAGE_KEY = 'selectedPreset';
