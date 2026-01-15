/**
 * Narrative tracker - analyzes fringe-to-mainstream narrative propagation
 */

import type { NewsItem } from '$lib/types';
import { NARRATIVE_PATTERNS, SOURCE_TYPES, type NarrativePattern } from '$lib/config/analysis';

// Types for narrative results
export interface NarrativeData {
	id: string;
	name: string;
	category: string;
	severity: NarrativePattern['severity'];
	count: number;
	fringeCount: number;
	mainstreamCount: number;
	sources: string[];
	headlines: NewsItem[];
	keywords: string[];
}

export interface EmergingFringe extends NarrativeData {
	status: 'emerging' | 'spreading' | 'viral';
}

export interface FringeToMainstream extends NarrativeData {
	status: 'crossing';
	crossoverLevel: number;
}

export interface NarrativeResults {
	emergingFringe: EmergingFringe[];
	fringeToMainstream: FringeToMainstream[];
	narrativeWatch: NarrativeData[];
	disinfoSignals: NarrativeData[];
}

// Track narrative history for crossover detection
const narrativeHistory: Record<
	string,
	{
		firstSeen: number;
		sources: Set<string>;
	}
> = {};

/**
 * Format narrative ID to display name
 */
function formatNarrativeName(id: string): string {
	return id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Classify source type
 */
function classifySource(source: string): 'fringe' | 'alternative' | 'mainstream' | null {
	const lowerSource = source.toLowerCase();

	for (const fringeSource of SOURCE_TYPES.fringe) {
		if (lowerSource.includes(fringeSource)) return 'fringe';
	}
	for (const altSource of SOURCE_TYPES.alternative) {
		if (lowerSource.includes(altSource)) return 'alternative';
	}
	for (const msSource of SOURCE_TYPES.mainstream) {
		if (lowerSource.includes(msSource)) return 'mainstream';
	}
	return null;
}

/**
 * Analyze narratives across all news items
 */
export function analyzeNarratives(allNews: NewsItem[]): NarrativeResults | null {
	if (!allNews || allNews.length === 0) return null;

	const now = Date.now();
	const results: NarrativeResults = {
		emergingFringe: [],
		fringeToMainstream: [],
		narrativeWatch: [],
		disinfoSignals: []
	};

	for (const narrative of NARRATIVE_PATTERNS) {
		const matches: NewsItem[] = [];
		const sourceMatches: {
			fringe: NewsItem[];
			alternative: NewsItem[];
			mainstream: NewsItem[];
		} = {
			fringe: [],
			alternative: [],
			mainstream: []
		};

		// Find matching news items
		for (const item of allNews) {
			const title = (item.title || '').toLowerCase();
			const source = (item.source || '').toLowerCase();

			const hasMatch = narrative.keywords.some((kw) => title.includes(kw.toLowerCase()));

			if (hasMatch) {
				matches.push(item);

				const sourceType = classifySource(source);
				if (sourceType) {
					sourceMatches[sourceType].push(item);
				}
			}
		}

		if (matches.length === 0) continue;

		// Update narrative history
		if (!narrativeHistory[narrative.id]) {
			narrativeHistory[narrative.id] = {
				firstSeen: now,
				sources: new Set()
			};
		}
		for (const match of matches) {
			narrativeHistory[narrative.id].sources.add(match.source);
		}

		// Build narrative data
		const narrativeData: NarrativeData = {
			id: narrative.id,
			name: formatNarrativeName(narrative.id),
			category: narrative.category,
			severity: narrative.severity,
			count: matches.length,
			fringeCount: sourceMatches.fringe.length,
			mainstreamCount: sourceMatches.mainstream.length,
			sources: [...new Set(matches.map((m) => m.source))].slice(0, 5),
			headlines: matches.slice(0, 3),
			keywords: narrative.keywords
		};

		// Categorize narrative
		if (sourceMatches.mainstream.length > 0 && sourceMatches.fringe.length > 0) {
			// Fringe to Mainstream crossover
			results.fringeToMainstream.push({
				...narrativeData,
				status: 'crossing',
				crossoverLevel: sourceMatches.mainstream.length / matches.length
			});
		} else if (narrative.severity === 'disinfo') {
			// Known disinformation pattern
			results.disinfoSignals.push(narrativeData);
		} else if (sourceMatches.fringe.length > 0 || sourceMatches.alternative.length > 0) {
			// Emerging from fringe sources
			const status: EmergingFringe['status'] =
				matches.length >= 5 ? 'viral' : matches.length >= 3 ? 'spreading' : 'emerging';

			results.emergingFringe.push({
				...narrativeData,
				status
			});
		} else {
			// General narrative watch
			results.narrativeWatch.push(narrativeData);
		}
	}

	// Sort results
	results.emergingFringe.sort((a, b) => b.count - a.count);
	results.fringeToMainstream.sort((a, b) => b.crossoverLevel - a.crossoverLevel);
	results.narrativeWatch.sort((a, b) => b.count - a.count);
	results.disinfoSignals.sort((a, b) => b.count - a.count);

	return results;
}

/**
 * Get narrative summary for status display
 */
export function getNarrativeSummary(results: NarrativeResults | null): {
	total: number;
	status: string;
} {
	if (!results) {
		return { total: 0, status: 'NO DATA' };
	}

	const total =
		results.emergingFringe.length +
		results.fringeToMainstream.length +
		results.narrativeWatch.length +
		results.disinfoSignals.length;

	return {
		total,
		status: total > 0 ? `${total} ACTIVE` : 'MONITORING'
	};
}

/**
 * Clear narrative history (for testing or reset)
 */
export function clearNarrativeHistory(): void {
	for (const key of Object.keys(narrativeHistory)) {
		delete narrativeHistory[key];
	}
}
