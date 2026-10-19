/**
 * GDELT Conflict Events
 *
 * GDELT retired the GEO 2.0 endpoint this module used to read (api/v2/geo/geo now
 * returns 404), so conflict hotspots are derived from the DOC 2.0 article list:
 * recent conflict-related headlines are geolocated by region keyword and grouped
 * per region. Severity is inferred from how many articles cover each region.
 */

import { logger } from '$lib/config/api';
import { REGION_CENTERS, getNewsCoordinates } from '$lib/config/map';
import { sanitizeArticleTitle } from '$lib/services/security';
import { fetchGdeltArticles, type GdeltArticle } from './gdelt';

/**
 * Processed conflict event for the dashboard map
 */
export interface GdeltConflictEvent {
	id: string;
	name: string;
	description: string;
	lat: number;
	lon: number;
	type: 'conflict' | 'crisis' | 'tension' | 'development';
	severity: 'critical' | 'high' | 'elevated' | 'low';
	status: 'active';
	eventCode: string;
	eventCodeDescription: string;
	goldsteinScale: number;
	avgTone: number;
	numArticles: number;
	numMentions: number;
	country: string;
	countryCode: string;
	sourceUrl: string;
	timestamp: number;
	dateAdded: string;
	imageUrl?: string;
	articles: Array<{ title: string; url: string; source?: string }>;
}

const CONFLICT_QUERY = '(conflict OR war OR military OR attack OR airstrike)';

/** Regions too broad to be a meaningful conflict marker */
const GENERIC_REGIONS = new Set([
	'usa',
	'europe',
	'asia',
	'africa',
	'middle_east',
	'south_america'
]);

/** Thresholds are article counts per region within the timespan */
const LEVELS: Array<{
	minArticles: number;
	severity: GdeltConflictEvent['severity'];
	type: GdeltConflictEvent['type'];
	eventCode: string;
	eventCodeDescription: string;
}> = [
	{
		minArticles: 20,
		severity: 'critical',
		type: 'conflict',
		eventCode: '19',
		eventCodeDescription: 'Fight/use conventional military force'
	},
	{
		minArticles: 10,
		severity: 'high',
		type: 'crisis',
		eventCode: '18',
		eventCodeDescription: 'Assault'
	},
	{
		minArticles: 5,
		severity: 'elevated',
		type: 'tension',
		eventCode: '14',
		eventCodeDescription: 'Protest'
	},
	{
		minArticles: 0,
		severity: 'low',
		type: 'development',
		eventCode: '13',
		eventCodeDescription: 'Threaten'
	}
];

/** GDELT dates look like 20261018T130000Z */
function parseSeenDate(seendate: string): number {
	const m = seendate?.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
	const time = m ? Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`) : NaN;
	return isNaN(time) ? Date.now() : time;
}

function formatRegionName(region: string): string {
	return region
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

function groupByRegion(articles: GdeltArticle[]): GdeltConflictEvent[] {
	const groups = new Map<string, GdeltArticle[]>();

	for (const article of articles) {
		const coords = getNewsCoordinates(article.title ?? '');
		if (!coords || GENERIC_REGIONS.has(coords.region)) continue;
		const group = groups.get(coords.region);
		if (group) group.push(article);
		else groups.set(coords.region, [article]);
	}

	const events: GdeltConflictEvent[] = [];

	for (const [region, regionArticles] of groups) {
		const center = REGION_CENTERS.find((r) => r.name === region);
		if (!center) continue;

		const level =
			LEVELS.find((l) => regionArticles.length >= l.minArticles) ?? LEVELS[LEVELS.length - 1];
		const articles = regionArticles
			.map((a) => ({
				title: sanitizeArticleTitle(a.title),
				url: a.url,
				source: a.domain
			}))
			.filter((a) => a.title);
		const latest = Math.max(...regionArticles.map((a) => parseSeenDate(a.seendate)));
		const name = formatRegionName(region);

		events.push({
			id: `gdelt-${region}`,
			name,
			description:
				articles[0]?.title ?? `${regionArticles.length} articles reporting events in ${name}`,
			lat: center.lat,
			lon: center.lon,
			type: level.type,
			severity: level.severity,
			status: 'active',
			eventCode: level.eventCode,
			eventCodeDescription: level.eventCodeDescription,
			goldsteinScale: -5, // Conflicts have negative Goldstein scores
			avgTone: -3,
			numArticles: regionArticles.length,
			numMentions: regionArticles.length,
			country: name,
			countryCode: region,
			sourceUrl: articles[0]?.url ?? '',
			timestamp: latest,
			dateAdded: new Date(latest).toISOString(),
			imageUrl: regionArticles.find((a) => a.socialimage)?.socialimage,
			articles
		});
	}

	return events.sort((a, b) => b.numArticles - a.numArticles);
}

/**
 * Fetch conflict hotspots from recent GDELT coverage.
 * Rejects if GDELT is unavailable so callers can tell "no events" from "request failed".
 */
export async function fetchConflictEventsFromGDELT(
	options: { query?: string; timespan?: string; maxRecords?: number } = {}
): Promise<GdeltConflictEvent[]> {
	const query = options.query ? `(${options.query}) AND ${CONFLICT_QUERY}` : CONFLICT_QUERY;

	const articles = await fetchGdeltArticles({
		query,
		timespan: options.timespan ?? '48h',
		maxRecords: options.maxRecords ?? 250,
		priority: 'high'
	});
	const events = groupByRegion(articles);
	logger.log('GDELT Conflicts', `${articles.length} articles -> ${events.length} regions`);
	return events;
}
