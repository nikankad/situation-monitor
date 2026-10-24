/**
 * Story grouping - collects headlines about the same event from different sources
 */

import type { NewsItem } from '$lib/types';

/** Headlines share a story when they have at least this many words in common... */
const MIN_SHARED_WORDS = 3;
/** ...and this share of their combined words */
const MIN_SIMILARITY = 0.4;

const STOP_WORDS = new Set([
	'the',
	'and',
	'for',
	'with',
	'that',
	'this',
	'from',
	'are',
	'was',
	'were',
	'has',
	'have',
	'had',
	'its',
	'into',
	'over',
	'after',
	'before',
	'about',
	'amid',
	'says',
	'say',
	'will',
	'new',
	'not',
	'but',
	'who',
	'what',
	'how',
	'why',
	'more',
	'than',
	'out',
	'off',
	'up',
	'you',
	'your',
	'their',
	'could',
	'would',
	'may'
]);

export interface Story {
	/** Newest headline in the group */
	headline: NewsItem;
	items: NewsItem[];
	/** Distinct sources carrying the story */
	sources: string[];
	firstSeen: number;
	lastSeen: number;
	alertCount: number;
}

function tokenize(title: string): Set<string> {
	const words = title
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.split(/\s+/)
		.filter((word) => word.length > 2 && !STOP_WORDS.has(word));
	return new Set(words);
}

function similar(a: Set<string>, b: Set<string>): boolean {
	let shared = 0;
	for (const word of a) if (b.has(word)) shared++;
	if (shared < MIN_SHARED_WORDS) return false;
	return shared / (a.size + b.size - shared) >= MIN_SIMILARITY;
}

/**
 * Group headlines into stories. Largest stories (most sources) come first.
 */
export function clusterStories(items: NewsItem[]): Story[] {
	const sorted = [...items].sort((a, b) => b.timestamp - a.timestamp);
	const groups: Array<{ words: Set<string>; items: NewsItem[] }> = [];

	for (const item of sorted) {
		const words = tokenize(item.title || '');
		const group = groups.find((g) => similar(g.words, words));
		if (group) group.items.push(item);
		else groups.push({ words, items: [item] });
	}

	return groups
		.map((group) => {
			const timestamps = group.items.map((i) => i.timestamp);
			return {
				headline: group.items[0],
				items: group.items,
				sources: [...new Set(group.items.map((i) => i.source))],
				firstSeen: Math.min(...timestamps),
				lastSeen: Math.max(...timestamps),
				alertCount: group.items.filter((i) => i.isAlert).length
			};
		})
		.sort((a, b) => b.sources.length - a.sources.length || b.lastSeen - a.lastSeen);
}
