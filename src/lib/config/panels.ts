/**
 * Panel configuration
 */

export interface PanelConfig {
	name: string;
	priority: 1 | 2 | 3;
}

export type PanelId =
	| 'map'
	| 'politics'
	| 'tech'
	| 'finance'
	| 'gov'
	| 'heatmap'
	| 'markets'
	| 'monitors'
	| 'polymarket'
	| 'mainchar'
	| 'printer'
	| 'contracts'
	| 'ai'
	| 'layoffs'
	| 'leaders'
	| 'intel'
	| 'correlation'
	| 'narrative'
	| 'fed';

export const PANELS: Record<PanelId, PanelConfig> = {
	map: { name: 'Global Situation', priority: 1 },
	politics: { name: 'Politics', priority: 1 },
	tech: { name: 'Tech', priority: 1 },
	finance: { name: 'Finance', priority: 1 },
	gov: { name: 'Government', priority: 2 },
	heatmap: { name: 'Sector Heatmap', priority: 1 },
	markets: { name: 'Markets', priority: 1 },
	monitors: { name: 'Custom Monitors', priority: 1 },
	polymarket: { name: 'Polymarket', priority: 2 },
	mainchar: { name: 'Main Character', priority: 2 },
	printer: { name: 'Money Printer', priority: 2 },
	contracts: { name: 'Gov Contracts', priority: 3 },
	ai: { name: 'AI', priority: 3 },
	layoffs: { name: 'Layoffs Tracker', priority: 3 },
	leaders: { name: 'World Leaders', priority: 1 },
	intel: { name: 'Intel Feed', priority: 2 },
	correlation: { name: 'Pattern Analysis', priority: 1 },
	narrative: { name: 'Global Sentiment', priority: 1 },
	fed: { name: 'Federal Reserve', priority: 1 }
};

export const NON_DRAGGABLE_PANELS: PanelId[] = ['map'];

export const MAP_ZOOM_MIN = 1;
export const MAP_ZOOM_MAX = 4;
export const MAP_ZOOM_STEP = 0.5;
