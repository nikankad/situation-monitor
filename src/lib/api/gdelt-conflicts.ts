/**
 * GDELT Conflict Events API
 * 
 * Fetches real-time conflict events from GDELT GEO 2.0 and GKG APIs.
 * Uses GDELT Event schema with QuadClass 3 (verbal conflict) and 4 (material conflict).
 * 
 * Reference: https://blog.gdeltproject.org/gdelt-geo-2-0-api-debuts/
 * CAMEO Codes: http://data.gdeltproject.org/documentation/CAMEO.Manual.1.1b3.pdf
 */

import { fetchWithProxy, logger } from '$lib/config/api';
import { sanitizeArticleTitle } from '$lib/services/security';

// ============================================================================
// GDELT Event Schema Types
// ============================================================================

/**
 * GDELT QuadClass values (from CAMEO/GDELT Event codebook)
 * 1 = Verbal Cooperation
 * 2 = Material Cooperation  
 * 3 = Verbal Conflict
 * 4 = Material Conflict
 */
export type GdeltQuadClass = 1 | 2 | 3 | 4;

/**
 * CAMEO EventRootCode ranges for conflicts:
 * 10-14: Verbal Conflict (demands, disapproval, reject, threaten, protest)
 * 15-20: Material Conflict (exhibit force, reduce relations, coerce, assault, fight, mass violence)
 */
export const CONFLICT_EVENT_CODES = {
	// Verbal Conflict (QuadClass 3)
	DEMAND: '10',
	DISAPPROVE: '11', 
	REJECT: '12',
	THREATEN: '13',
	PROTEST: '14',
	// Material Conflict (QuadClass 4)
	EXHIBIT_FORCE: '15',
	REDUCE_RELATIONS: '16',
	COERCE: '17',
	ASSAULT: '18',
	FIGHT: '19',
	MASS_VIOLENCE: '20'
} as const;

/**
 * Severity mapping based on CAMEO EventRootCode
 */
function getEventSeverity(eventCode: string): 'critical' | 'high' | 'elevated' | 'low' {
	const code = eventCode.substring(0, 2);
	switch (code) {
		case '20': return 'critical';  // Mass violence
		case '19': return 'critical';  // Fight/use military force
		case '18': return 'high';      // Assault
		case '17': return 'high';      // Coerce
		case '15':
		case '16': return 'elevated';  // Exhibit force, reduce relations
		case '13':
		case '14': return 'elevated';  // Threaten, protest
		default: return 'low';         // Verbal conflict (10-12)
	}
}

/**
 * Get conflict type based on CAMEO EventRootCode
 */
function getConflictType(eventCode: string): 'conflict' | 'crisis' | 'tension' | 'development' {
	const code = eventCode.substring(0, 2);
	switch (code) {
		case '19':
		case '20': return 'conflict';   // Military action, mass violence
		case '17':
		case '18': return 'crisis';     // Coerce, assault
		case '13':
		case '14':
		case '15':
		case '16': return 'tension';    // Threaten, protest, exhibit force
		default: return 'development';  // Verbal conflict events
	}
}

// ============================================================================
// GDELT API Response Types
// ============================================================================

/**
 * GDELT GEO 2.0 API event structure
 */
export interface GdeltGeoEvent {
	urlsource: string;
	url: string;
	name: string;
	type: string;
	countrycode: string;
	adm1code?: string;
	latitude: number;
	longitude: number;
	numarticles?: number;
	nummentions?: number;
	eventcode?: string;
	goldsteinscale?: number;
	avgtone?: number;
	dateadded?: string;
	sourceurl?: string;
}

/**
 * GDELT GKG (Global Knowledge Graph) record for richer context
 */
export interface GdeltGkgRecord {
	DATE: string;
	SourceCollectionIdentifier: number;
	SourceCommonName: string;
	DocumentIdentifier: string;
	Counts?: string;
	V2Counts?: string;
	Themes?: string;
	V2Themes?: string;
	Locations?: string;
	V2Locations?: string;
	Persons?: string;
	V2Persons?: string;
	Organizations?: string;
	V2Organizations?: string;
	V2Tone?: string;
	GCAM?: string;
	SharingImage?: string;
	RelatedImages?: string;
	SocialImageEmbeds?: string;
	SocialVideoEmbeds?: string;
	Quotations?: string;
	AllNames?: string;
	Amounts?: string;
	TranslationInfo?: string;
	Extras?: string;
}

// ============================================================================
// Conflict Event Interface (for dashboard consumption)
// ============================================================================

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

// ============================================================================
// CAMEO Event Code Descriptions
// ============================================================================

const CAMEO_DESCRIPTIONS: Record<string, string> = {
	'10': 'Make public statement of demand',
	'11': 'Express disapproval',
	'12': 'Reject/refuse proposal',
	'13': 'Threaten',
	'14': 'Protest',
	'15': 'Exhibit military posturing',
	'16': 'Reduce/sever diplomatic relations',
	'17': 'Coerce',
	'18': 'Assault',
	'19': 'Fight/use conventional military force',
	'20': 'Engage in mass violence/mass killings',
	'170': 'Coerce, not specified',
	'171': 'Seize/damage property',
	'172': 'Impose blockade/embargo',
	'173': 'Violate ceasefire',
	'174': 'Use tactics of repression',
	'175': 'Attack cybernetically',
	'180': 'Use unconventional violence',
	'181': 'Abduct/hijack/take hostage',
	'182': 'Physically assault (non-lethal)',
	'183': 'Conduct suicide/vehicular attack',
	'184': 'Use weapons of mass destruction',
	'185': 'Military use of weapons',
	'186': 'Detain/incarcerate',
	'190': 'Use conventional military force',
	'191': 'Impose blockade',
	'192': 'Occupy territory',
	'193': 'Fight with small arms',
	'194': 'Fight with artillery/tanks',
	'195': 'Employ aerial weapons',
	'196': 'Violate ceasefire',
	'200': 'Use unconventional mass violence',
	'201': 'Engage in mass expulsion',
	'202': 'Engage in mass killing',
	'203': 'Engage in ethnic cleansing',
	'204': 'Use weapons of mass destruction'
};

function getEventCodeDescription(code: string): string {
	// Try full code first, then root code
	return CAMEO_DESCRIPTIONS[code] || CAMEO_DESCRIPTIONS[code.substring(0, 2)] || 'Conflict event';
}

// ============================================================================
// GDELT API Functions
// ============================================================================

/**
 * Build GDELT GEO 2.0 API URL for conflict events
 * 
 * The GEO 2.0 API returns geolocated events with coordinates.
 * We filter for QuadClass 3 and 4 (verbal and material conflict).
 */
function buildGdeltGeoUrl(options: {
	query?: string;
	timespan?: string;
	maxRecords?: number;
	country?: string;
}): string {
	const {
		query = '',
		timespan = '24h',
		maxRecords = 250
	} = options;

	// Build conflict-focused query
	// GDELT has a limit on OR clauses, so we use a focused set of terms
	// Using theme-based filtering instead of many OR terms
	const conflictTerms = 'conflict OR war OR military OR attack';

	const fullQuery = query 
		? `(${query}) AND (${conflictTerms})`
		: `(${conflictTerms})`;

	const params = new URLSearchParams({
		query: `${fullQuery} sourcelang:english`,
		mode: 'pointdata',
		format: 'geojson',
		timespan: timespan,
		maxpoints: maxRecords.toString()
	});

	return `https://api.gdeltproject.org/api/v2/geo/geo?${params.toString()}`;
}

/**
 * Parse GDELT GeoJSON response into conflict events
 */
function parseGdeltGeoJson(geojson: GeoJSON.FeatureCollection): GdeltConflictEvent[] {
	if (!geojson.features || !Array.isArray(geojson.features)) {
		return [];
	}

	const events: GdeltConflictEvent[] = [];
	const seenLocations = new Set<string>();

	for (const feature of geojson.features) {
		if (feature.geometry.type !== 'Point') continue;
		
		const props = feature.properties as Record<string, unknown>;
		const coords = feature.geometry.coordinates as [number, number];
		
		if (!coords || coords.length < 2) continue;

		const [lon, lat] = coords;
		
		// Extract article data from HTML
		const htmlContent = (props.html as string) || '';
		const articles: Array<{ title: string; url: string; source?: string }> = [];
		const shareImage = (props.shareimage as string) || (props.sharingimage as string);

		// Parse HTML string: <a href="..." ...>Title</a>
		const linkRegex = /<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
		let match;
		while ((match = linkRegex.exec(htmlContent)) !== null) {
			try {
				const url = match[1];
				const rawTitle = match[2];
				// Sanitize title to prevent XSS from potentially malicious GDELT data
				const title = sanitizeArticleTitle(rawTitle);
				if (!title) continue; // Skip if title is empty after sanitization

				const urlObj = new URL(url);
				articles.push({
					url,
					title,
					source: urlObj.hostname.replace('www.', '')
				});
			} catch {
				// Skip invalid URLs
			}
		}

		// Create location key to deduplicate nearby events
		const locationKey = `${lat.toFixed(1)},${lon.toFixed(1)}`;
		
		const name = (props.name as string) || 'Unknown Location';
		// Use the first article URL as the source URL if available
		const url = articles.length > 0 ? articles[0].url : (props.url as string) || '';
		
		const urlSource = (props.urlsourcename as string) || (props.urlsource as string) || 'Unknown';
		const countryCode = (props.countrycode as string) || '';
		const numArticles = (props.count as number) || (props.numarticles as number) || 1;
		const dateAdded = (props.dateadded as string) || new Date().toISOString();
		
		// Determine event characteristics from available data
		// Since GEO API returns articles, we infer conflict type from article count and context
		const eventCode = numArticles >= 20 ? '19' : numArticles >= 10 ? '18' : numArticles >= 5 ? '14' : '13';
		const severity = getEventSeverity(eventCode);
		const conflictType = getConflictType(eventCode);

		// Skip if we've already seen this location (aggregate instead)
		if (seenLocations.has(locationKey)) {
			// Find existing event and increment count
			const existing = events.find(e => 
				e.lat.toFixed(1) === lat.toFixed(1) && 
				e.lon.toFixed(1) === lon.toFixed(1)
			);
			if (existing) {
				existing.numArticles += numArticles;
				// Merge new articles
				articles.forEach(a => {
					if (!existing.articles.some(ea => ea.url === a.url)) {
						existing.articles.push(a);
					}
				});
				
				// Upgrade severity if more articles
				if (existing.numArticles >= 20) {
					existing.severity = 'critical';
					existing.type = 'conflict';
					existing.eventCode = '19';
				} else if (existing.numArticles >= 10) {
					existing.severity = 'high';
					existing.type = 'crisis';
					existing.eventCode = '18';
				}
			}
			continue;
		}
		seenLocations.add(locationKey);

		const id = `gdelt-${locationKey}-${Date.now()}`;
		
		// Use the first article title as the description if available, otherwise fallback
		let description = articles.length > 0 
			? articles[0].title 
			: `${numArticles} article${numArticles > 1 ? 's' : ''} from ${urlSource}`;

		// Clean up description if it's identical to the name or very short
		if (description === name || description.length < 5) {
			description = `${numArticles} article${numArticles > 1 ? 's' : ''} reporting events in ${name}`;
		}

		events.push({
			id,
			name,
			description,
			lat,
			lon,
			type: conflictType,
			severity,
			status: 'active',
			eventCode,
			eventCodeDescription: getEventCodeDescription(eventCode),
			goldsteinScale: -5, // Conflicts have negative Goldstein scores
			avgTone: -3,
			numArticles,
			numMentions: numArticles,
			country: countryCode,
			countryCode,
			sourceUrl: url,
			timestamp: new Date(dateAdded).getTime() || Date.now(),
			dateAdded,
			imageUrl: shareImage,
			articles
		});
	}

	// Sort by number of articles (importance proxy)
	return events.sort((a, b) => b.numArticles - a.numArticles);
}

/**
 * Fetch conflict events from GDELT GEO 2.0 API
 * 
 * This is the main function that all conflict components should use.
 * Returns real-time geolocated conflict events from GDELT.
 * 
 * @param options - Query options for filtering events
 * @returns Array of conflict events, or empty array if no results
 */
export async function fetchConflictEventsFromGDELT(options: {
	query?: string;
	timespan?: string;
	maxRecords?: number;
	country?: string;
} = {}): Promise<GdeltConflictEvent[]> {
	const url = buildGdeltGeoUrl({
		query: options.query,
		timespan: options.timespan || '6h',
		maxRecords: options.maxRecords || 250,
		country: options.country
	});

	logger.log('GDELT Conflicts', `Fetching from: ${url.substring(0, 100)}...`);

	try {
		const response = await fetchWithProxy(url);
		
		if (!response.ok) {
			logger.error('GDELT Conflicts', `HTTP ${response.status}: ${response.statusText}`);
			return [];
		}

		const text = await response.text();

		// Handle empty responses
		if (!text || text.trim() === '' || text.trim() === '{}') {
			logger.log('GDELT Conflicts', 'No GDELT results for query');
			return [];
		}

		// Parse as GeoJSON
		let geojson: GeoJSON.FeatureCollection;
		try {
			geojson = JSON.parse(text);
		} catch (parseError) {
			logger.error('GDELT Conflicts', 'Failed to parse GDELT response as JSON');
			return [];
		}

		// Validate GeoJSON structure
		if (!geojson.type || geojson.type !== 'FeatureCollection') {
			logger.warn('GDELT Conflicts', 'Response is not a valid GeoJSON FeatureCollection');
			return [];
		}

		const events = parseGdeltGeoJson(geojson);
		logger.log('GDELT Conflicts', `Parsed ${events.length} conflict events from GDELT`);
		
		return events;
	} catch (error) {
		logger.error('GDELT Conflicts', 'Error fetching conflict events:', error);
		return [];
	}
}

/**
 * Fetch conflict events for a specific region/country
 */
export async function fetchRegionalConflicts(
	region: string,
	timespan: string = '48h'
): Promise<GdeltConflictEvent[]> {
	return fetchConflictEventsFromGDELT({
		query: region,
		timespan,
		maxRecords: 100
	});
}

/**
 * Fetch high-intensity conflict events (mass violence, military action)
 */
export async function fetchHighIntensityConflicts(
	timespan: string = '24h'
): Promise<GdeltConflictEvent[]> {
	const events = await fetchConflictEventsFromGDELT({
		query: 'war OR bombing OR airstrike',
		timespan,
		maxRecords: 100
	});

	// Filter to only high and critical severity
	return events.filter(e => e.severity === 'critical' || e.severity === 'high');
}

/**
 * Aggregate conflict events by country for summary statistics
 */
export function aggregateConflictsByCountry(
	events: GdeltConflictEvent[]
): Map<string, { count: number; severity: 'critical' | 'high' | 'elevated' | 'low' }> {
	const countryMap = new Map<string, { count: number; maxSeverity: number }>();
	
	const severityOrder = { critical: 4, high: 3, elevated: 2, low: 1 };
	const severityReverse = ['low', 'elevated', 'high', 'critical'] as const;

	for (const event of events) {
		const country = event.country || 'Unknown';
		const existing = countryMap.get(country);
		const severityValue = severityOrder[event.severity];
		
		if (existing) {
			existing.count++;
			existing.maxSeverity = Math.max(existing.maxSeverity, severityValue);
		} else {
			countryMap.set(country, { count: 1, maxSeverity: severityValue });
		}
	}

	// Convert back to severity labels
	const result = new Map<string, { count: number; severity: 'critical' | 'high' | 'elevated' | 'low' }>();
	for (const [country, data] of countryMap) {
		result.set(country, {
			count: data.count,
			severity: severityReverse[data.maxSeverity - 1]
		});
	}

	return result;
}
