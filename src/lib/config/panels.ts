/**
 * Panel configuration
 */

export interface PanelConfig {
	name: string;
	priority: 1 | 2 | 3;
	defaultEnabled?: boolean;
}

export type PanelId =
	| 'map'
	| 'politics'
	| 'tech'
	| 'finance'
	| 'gov'
	| 'markets'
	| 'polymarket'
	| 'contracts'
	| 'correlation'
	| 'economics'
	| 'narrative'
	| 'whales'
	| 'intel'
	| 'venezuela'
	| 'greenland'
	| 'iran';

export const PANELS: Record<PanelId, PanelConfig> = {
	map: { name: 'Global Situation', priority: 1 },
	politics: { name: 'Politics', priority: 1 },
	tech: { name: 'Tech', priority: 1 },
	finance: { name: 'Finance', priority: 1 },
	gov: { name: 'Government', priority: 2 },
	markets: { name: 'Markets', priority: 1 },
	polymarket: { name: 'Polymarket', priority: 2 },
	contracts: { name: 'Gov Contracts', priority: 3 },
	correlation: { name: 'Pattern Analysis', priority: 1 },
	narrative: { name: 'Global Sentiment', priority: 1 },
	economics: { name: 'Economic Indicators', priority: 2 },
	whales: { name: 'Whale Watch', priority: 3, defaultEnabled: false },
	intel: { name: 'Intel Feed', priority: 2, defaultEnabled: false },
	venezuela: { name: 'Venezuela Watch', priority: 2, defaultEnabled: false },
	greenland: { name: 'Greenland Watch', priority: 2, defaultEnabled: false },
	iran: { name: 'Iran Crisis', priority: 2, defaultEnabled: false }
};

export const NON_DRAGGABLE_PANELS: PanelId[] = ['map'];

export const MAP_ZOOM_MIN = 1;
export const MAP_ZOOM_MAX = 4;
export const MAP_ZOOM_STEP = 0.5;
