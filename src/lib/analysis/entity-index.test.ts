/**
 * Tests for the entity index
 */

import { describe, it, expect } from 'vitest';
import { buildEntityIndex, dedupeItems, getStats, itemKey } from './entity-index';
import { getEntity, entityKey } from '$lib/config/entities';
import type { NewsItem } from '$lib/types';

const HOUR = 60 * 60 * 1000;
const NOW = 1_000 * HOUR;

function item(title: string, overrides: Partial<NewsItem> & { hoursAgo?: number } = {}): NewsItem {
	const { hoursAgo = 1, ...rest } = overrides;
	return {
		id: title,
		title,
		link: `https://news.example/${encodeURIComponent(title)}`,
		source: 'Reuters',
		timestamp: NOW - hoursAgo * HOUR - 60_000,
		category: 'politics',
		...rest
	};
}

const iran = getEntity('region', 'iran')!;

describe('dedupeItems', () => {
	it('keeps one copy of each article, newest first', () => {
		const a = item('Story A', { hoursAgo: 3 });
		const b = item('Story B', { hoursAgo: 1 });
		const copyOfA = { ...a, id: 'other-feed', category: 'intel' as const };
		expect(dedupeItems([a, b, copyOfA])).toEqual([b, a]);
	});
});

describe('buildEntityIndex', () => {
	it('counts headlines by window and places them in the hourly histogram', () => {
		const index = buildEntityIndex(
			[
				item('Iran talks resume', { hoursAgo: 0.5 }),
				item('Iran sanctions debate', { hoursAgo: 5.5 }),
				item('Iran election preview', { hoursAgo: 10 }),
				item('Iran archive story', { hoursAgo: 40 })
			],
			NOW
		);
		const stats = getStats(index, iran);
		expect(stats.count).toBe(4);
		expect(stats.last6h).toBe(2);
		expect(stats.last24h).toBe(3);
		expect(stats.hourly).toHaveLength(24);
		expect(stats.hourly[23]).toBe(1);
		expect(stats.hourly[18]).toBe(1);
		expect(stats.hourly.reduce((a, b) => a + b, 0)).toBe(3);
	});

	it('counts the same article once across feeds and categories', () => {
		const a = item('Iran talks resume', { id: 'rss-1', category: 'politics' });
		const b = { ...a, id: 'gdelt-9', category: 'intel' as const };
		expect(getStats(buildEntityIndex([a, b], NOW), iran).count).toBe(1);
	});

	it('treats tracking parameters as the same article', () => {
		const base = { link: 'https://news.example/a', title: 'T', source: 'S' };
		expect(itemKey({ ...base, link: 'https://www.news.example/a/?utm_source=x' })).toBe(
			itemKey(base)
		);
	});

	it('tallies alerts, alert keywords and sources', () => {
		const stats = getStats(
			buildEntityIndex(
				[
					item('Iran missile test alarms neighbours', {
						isAlert: true,
						alertKeyword: 'missile',
						source: 'BBC'
					}),
					item('Iran strike reported', { isAlert: true, alertKeyword: 'strike', source: 'BBC' }),
					item('Iran budget talks', { source: 'CNN' })
				],
				NOW
			),
			iran
		);
		expect(stats.alertCount).toBe(2);
		expect(stats.alertKeywords.map((k) => k.keyword).sort()).toEqual(['missile', 'strike']);
		expect(stats.sourceCount).toBe(2);
		expect(stats.sources[0]).toEqual({ name: 'BBC', count: 2 });
	});

	it('measures the fringe share from source types', () => {
		const stats = getStats(
			buildEntityIndex(
				[
					item('Iran story one', { source: 'Reuters' }),
					item('Iran story two', { source: 'ZeroHedge' }),
					item('Iran story three', { source: 'Reuters' }),
					item('Iran story four', { source: 'Substack' })
				],
				NOW
			),
			iran
		);
		expect(stats.sourceMix.mainstream).toBe(2);
		expect(stats.sourceMix.fringe).toBe(1);
		expect(stats.sourceMix.alternative).toBe(1);
		expect(stats.fringeShare).toBe(50);
	});

	it('scores tone and leaves it null when there are no headlines', () => {
		const alarming = getStats(
			buildEntityIndex([item('Iran war escalates after attack')], NOW),
			iran
		);
		expect(alarming.tone).toBeLessThan(0);

		const none = getStats(buildEntityIndex([item('Unrelated gardening tips')], NOW), iran);
		expect(none.count).toBe(0);
		expect(none.tone).toBeNull();
		expect(none.hourly).toHaveLength(24);
	});

	it('finds the entities that appear together', () => {
		const stats = getStats(
			buildEntityIndex(
				[
					item('Iran threatens Hormuz oil shipping'),
					item('Iran and Israel trade accusations'),
					item('Crude oil climbs as Iran tension builds')
				],
				NOW
			),
			iran
		);
		const together = stats.coMentions.map((c) => entityKey(c.entity));
		expect(together).toContain('asset/crude-oil');
		expect(together).toContain('region/strait-hormuz');
		expect(together).not.toContain('region/iran');
		const oil = stats.coMentions.find((c) => entityKey(c.entity) === 'asset/crude-oil');
		expect(oil!.count).toBe(2);
	});

	it('shows momentum when recent headlines outpace the earlier pace', () => {
		const stats = getStats(
			buildEntityIndex(
				[
					item('Iran news a', { hoursAgo: 1 }),
					item('Iran news b', { hoursAgo: 2 }),
					item('Iran news c', { hoursAgo: 3 }),
					item('Iran news d', { hoursAgo: 8 }),
					item('Iran news e', { hoursAgo: 14 }),
					item('Iran news f', { hoursAgo: 20 })
				],
				NOW
			),
			iran
		);
		expect(stats.last6h).toBe(3);
		expect(stats.momentum).toBe(3);
	});
});
