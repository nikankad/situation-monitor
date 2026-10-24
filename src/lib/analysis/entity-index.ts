/**
 * Entity index - what the current headlines say about every entity in the registry
 *
 * Everything is derived from the headlines in the feeds right now, so counts describe the
 * feed window, not a long history.
 */

import type { NewsItem } from '$lib/types';
import { entityKey, matchEntities, type Entity } from '$lib/config/entities';
import { analyzeHeadline, type SentimentType } from './sentiment';
import { classifySource } from './sources';

const HOUR_MS = 60 * 60 * 1000;
const HISTOGRAM_HOURS = 24;
const RECENT_HOURS = 6;
const TRACKING_PARAMS = /^(utm_|fbclid$|gclid$|ref$|cmpid$)/i;

export interface CoMention {
	entity: Entity;
	count: number;
}

export interface SourceCount {
	name: string;
	count: number;
}

export interface EntityStats {
	entity: Entity;
	/** Newest first */
	items: NewsItem[];
	count: number;
	last6h: number;
	last24h: number;
	/** Last 6 hours compared with the average 6-hour block in the 18 hours before; 0 when quiet */
	momentum: number;
	alertCount: number;
	sourceCount: number;
	sources: SourceCount[];
	sourceMix: { mainstream: number; alternative: number; fringe: number; unclassified: number };
	/** Percent of headlines from fringe or alternative sources */
	fringeShare: number;
	/** Keyword tone from -100 (alarming) to +100 (positive); null with no headlines */
	tone: number | null;
	sentiment: Record<SentimentType, number>;
	coMentions: CoMention[];
	/** Headlines per hour for the last 24 hours, oldest first */
	hourly: number[];
	alertKeywords: Array<{ keyword: string; count: number }>;
}

export type EntityIndex = Map<string, EntityStats>;

/**
 * A key that is the same for the same article across feeds and categories
 */
export function itemKey(item: Pick<NewsItem, 'link' | 'title' | 'source'>): string {
	try {
		const url = new URL(item.link);
		const params = [...url.searchParams.entries()]
			.filter(([name]) => !TRACKING_PARAMS.test(name))
			.map(([name, value]) => `${name}=${value}`)
			.sort();
		const host = url.hostname.replace(/^www\./i, '').toLowerCase();
		const path = url.pathname.replace(/\/+$/, '');
		if (path || params.length > 0) {
			return `${host}${path}${params.length > 0 ? `?${params.join('&')}` : ''}`;
		}
	} catch {
		// Fall through to the title-based key
	}
	return `${item.source}|${item.title}`.toLowerCase().trim();
}

function emptyStats(entity: Entity): EntityStats {
	return {
		entity,
		items: [],
		count: 0,
		last6h: 0,
		last24h: 0,
		momentum: 0,
		alertCount: 0,
		sourceCount: 0,
		sources: [],
		sourceMix: { mainstream: 0, alternative: 0, fringe: 0, unclassified: 0 },
		fringeShare: 0,
		tone: null,
		sentiment: { positive: 0, negative: 0, neutral: 0, critical: 0, alarming: 0 },
		coMentions: [],
		hourly: new Array(HISTOGRAM_HOURS).fill(0),
		alertKeywords: []
	};
}

function tally<K>(map: Map<K, number>, key: K): void {
	map.set(key, (map.get(key) ?? 0) + 1);
}

interface Bucket {
	entity: Entity;
	items: NewsItem[];
	co: Map<string, CoMention>;
}

function buildStats(
	bucket: Bucket,
	scores: Map<NewsItem, { score: number; sentiment: SentimentType }>,
	now: number
): EntityStats {
	const { items } = bucket;
	const stats = emptyStats(bucket.entity);
	stats.items = items;
	stats.count = items.length;

	const sourceCounts = new Map<string, number>();
	const keywordCounts = new Map<string, number>();
	let toneTotal = 0;
	let unusual = 0;

	for (const item of items) {
		const ageMs = now - item.timestamp;
		if (ageMs <= RECENT_HOURS * HOUR_MS) stats.last6h++;
		if (ageMs <= HISTOGRAM_HOURS * HOUR_MS) {
			stats.last24h++;
			const hoursAgo = Math.min(HISTOGRAM_HOURS - 1, Math.max(0, Math.floor(ageMs / HOUR_MS)));
			stats.hourly[HISTOGRAM_HOURS - 1 - hoursAgo]++;
		}

		if (item.isAlert) {
			stats.alertCount++;
			if (item.alertKeyword) tally(keywordCounts, item.alertKeyword);
		}

		tally(sourceCounts, item.source || 'Unknown');
		const kind = classifySource(item.source || '');
		stats.sourceMix[kind ?? 'unclassified']++;
		if (kind === 'fringe' || kind === 'alternative') unusual++;

		const analyzed = scores.get(item);
		if (analyzed) {
			stats.sentiment[analyzed.sentiment]++;
			toneTotal += analyzed.score;
		}
	}

	stats.sources = [...sourceCounts.entries()]
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);
	stats.sourceCount = stats.sources.length;
	stats.fringeShare = items.length > 0 ? Math.round((unusual / items.length) * 100) : 0;
	stats.tone = items.length > 0 ? Math.round((toneTotal / items.length) * 100) : null;
	stats.alertKeywords = [...keywordCounts.entries()]
		.map(([keyword, count]) => ({ keyword, count }))
		.sort((a, b) => b.count - a.count);

	const earlier = stats.last24h - stats.last6h;
	const earlierBlockAverage = earlier / 3;
	stats.momentum =
		stats.last6h === 0
			? 0
			: Math.round((stats.last6h / Math.max(1, earlierBlockAverage)) * 10) / 10;

	stats.coMentions = [...bucket.co.values()].sort((a, b) => b.count - a.count);

	return stats;
}

/**
 * Drop repeats of the same article across feeds and categories; newest first
 */
export function dedupeItems(items: NewsItem[]): NewsItem[] {
	const seen = new Set<string>();
	const unique: NewsItem[] = [];
	for (const item of [...items].sort((a, b) => b.timestamp - a.timestamp)) {
		const key = itemKey(item);
		if (seen.has(key)) continue;
		seen.add(key);
		unique.push(item);
	}
	return unique;
}

/**
 * Index the headlines by entity. Only entities with at least one headline appear in the result.
 */
export function buildEntityIndex(items: NewsItem[], now: number = Date.now()): EntityIndex {
	const buckets = new Map<string, Bucket>();
	const scores = new Map<NewsItem, { score: number; sentiment: SentimentType }>();

	for (const item of dedupeItems(items)) {
		const matched = matchEntities(item.title || '');
		if (matched.length === 0) continue;

		const { score, sentiment } = analyzeHeadline(item);
		scores.set(item, { score, sentiment });

		for (const entity of matched) {
			const key = entityKey(entity);
			let bucket = buckets.get(key);
			if (!bucket) {
				bucket = { entity, items: [], co: new Map() };
				buckets.set(key, bucket);
			}
			bucket.items.push(item);

			for (const other of matched) {
				if (other === entity) continue;
				const otherKey = entityKey(other);
				const co = bucket.co.get(otherKey);
				if (co) co.count++;
				else bucket.co.set(otherKey, { entity: other, count: 1 });
			}
		}
	}

	const index: EntityIndex = new Map();
	for (const [key, bucket] of buckets) index.set(key, buildStats(bucket, scores, now));
	return index;
}

/**
 * Stats for an entity, or an empty record when no headline mentions it
 */
export function getStats(index: EntityIndex, entity: Entity): EntityStats {
	return index.get(entityKey(entity)) ?? emptyStats(entity);
}
