/**
 * Tests for story grouping
 */

import { describe, it, expect } from 'vitest';
import { clusterStories } from './stories';
import type { NewsItem } from '$lib/types';

const HOUR = 60 * 60 * 1000;
const NOW = 1_000 * HOUR;

function item(title: string, source: string, hoursAgo: number, isAlert = false): NewsItem {
	return {
		id: `${source}-${title}`,
		title,
		link: `https://${source}.example/${encodeURIComponent(title)}`,
		source,
		timestamp: NOW - hoursAgo * HOUR,
		category: 'politics',
		isAlert
	};
}

describe('clusterStories', () => {
	it('groups headlines about the same event and keeps others apart', () => {
		const stories = clusterStories([
			item('Tanker struck near Strait of Hormuz, insurers raise rates', 'wire', 1),
			item('Insurers raise rates after tanker struck near Strait of Hormuz', 'daily', 2),
			item('Central bank holds rates steady amid inflation worries', 'times', 3)
		]);
		expect(stories).toHaveLength(2);
		expect(stories[0].sources.sort()).toEqual(['daily', 'wire']);
	});

	it('puts the story with the most sources first and uses its newest headline', () => {
		const stories = clusterStories([
			item('Lone report about harvest forecasts revised sharply', 'a', 0),
			item('Tanker struck near Strait of Hormuz, insurers raise rates', 'b', 5),
			item('Insurers raise rates after tanker struck near Strait of Hormuz', 'c', 2)
		]);
		expect(stories[0].sources).toHaveLength(2);
		expect(stories[0].headline.source).toBe('c');
		expect(stories[0].firstSeen).toBe(NOW - 5 * HOUR);
		expect(stories[0].lastSeen).toBe(NOW - 2 * HOUR);
	});

	it('does not group headlines that share only a couple of words', () => {
		const stories = clusterStories([
			item('Iran talks resume today', 'a', 1),
			item('Iran football team wins today', 'b', 1)
		]);
		expect(stories).toHaveLength(2);
	});

	it('counts each source once and tallies alerts', () => {
		const stories = clusterStories([
			item('Tanker struck near Strait of Hormuz, insurers raise rates', 'wire', 1, true),
			item('Tanker struck near Strait of Hormuz, insurers raise rates', 'wire', 2)
		]);
		expect(stories).toHaveLength(1);
		expect(stories[0].items).toHaveLength(2);
		expect(stories[0].sources).toEqual(['wire']);
		expect(stories[0].alertCount).toBe(1);
	});

	it('returns nothing for no headlines', () => {
		expect(clusterStories([])).toEqual([]);
	});
});
