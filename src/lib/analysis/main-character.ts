/**
 * Main Character analysis - tracks prominent figures in news
 */

import type { NewsItem } from '$lib/types';
import { PERSON_PATTERNS } from '$lib/config/analysis';

export interface MainCharacterEntry {
	name: string;
	count: number;
	rank: number;
}

export interface MainCharacterResults {
	characters: MainCharacterEntry[];
	topCharacter: MainCharacterEntry | null;
}

/**
 * Calculate the "Main Character" (most mentioned person) from news headlines
 */
export function calculateMainCharacter(allNews: NewsItem[]): MainCharacterResults {
	if (!allNews || allNews.length === 0) {
		return { characters: [], topCharacter: null };
	}

	const counts: Record<string, number> = {};

	// Count mentions for each person
	for (const item of allNews) {
		const text = (item.title || '').toLowerCase();

		for (const { pattern, name } of PERSON_PATTERNS) {
			// Reset lastIndex for global regex
			pattern.lastIndex = 0;
			const matches = text.match(pattern);

			if (matches) {
				counts[name] = (counts[name] || 0) + matches.length;
			}
		}
	}

	// Sort by count and create ranked entries
	const sorted = Object.entries(counts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([name, count], index) => ({
			name,
			count,
			rank: index + 1
		}));

	return {
		characters: sorted,
		topCharacter: sorted[0] || null
	};
}

/**
 * Get a summary of the main character for display
 */
export function getMainCharacterSummary(results: MainCharacterResults): {
	name: string;
	count: number;
	status: string;
} {
	if (!results.topCharacter) {
		return { name: '', count: 0, status: 'NO DATA' };
	}

	const { name, count } = results.topCharacter;
	return {
		name,
		count,
		status: `${name} (${count} mentions)`
	};
}

/**
 * Calculate relative dominance of main character
 * Returns a value 0-100 representing how dominant the top character is
 */
export function calculateDominance(results: MainCharacterResults): number {
	if (results.characters.length < 2) return 100;

	const top = results.characters[0];
	const second = results.characters[1];

	if (!top || top.count === 0) return 0;
	if (!second || second.count === 0) return 100;

	// Dominance is how much more the top is mentioned vs second
	const ratio = top.count / second.count;
	// Convert to 0-100 scale (ratio of 2 = 100% dominant)
	return Math.min(100, Math.round((ratio - 1) * 100));
}
