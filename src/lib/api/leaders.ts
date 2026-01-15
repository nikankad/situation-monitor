/**
 * World Leaders API - Fetch news for world leaders from GDELT
 * Also integrates with OpenSanctions for updated leader data
 */

import { WORLD_LEADERS } from '$lib/config/leaders';
import type { WorldLeader, LeaderNews } from '$lib/types';
import { CORS_PROXY_URL, logger } from '$lib/config/api';

// OpenSanctions API for updated world leader data
const OPENSANCTIONS_API = 'https://api.opensanctions.org';
const OPENSANCTIONS_DATASET = 'us_cia_world_leaders';

interface GdeltArticle {
	title: string;
	url: string;
	seendate: string;
	domain: string;
}

interface GdeltResponse {
	articles?: GdeltArticle[];
}

/**
 * Fetch news for a single leader
 */
async function fetchLeaderNews(leader: WorldLeader): Promise<WorldLeader> {
	// Build query from leader's keywords
	const query = leader.keywords.map((k) => `"${k}"`).join(' OR ');

	try {
		const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=5&format=json&sort=date`;
		const proxyUrl = CORS_PROXY_URL + encodeURIComponent(gdeltUrl);

		const response = await fetch(proxyUrl);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const contentType = response.headers.get('content-type');
		if (!contentType?.includes('application/json')) {
			return { ...leader, news: [] };
		}

		const text = await response.text();
		let data: GdeltResponse;
		try {
			data = JSON.parse(text);
		} catch {
			return { ...leader, news: [] };
		}

		const news: LeaderNews[] = (data.articles || []).map((article) => ({
			source: article.domain || 'Unknown',
			title: article.title || '',
			link: article.url || '',
			pubDate: article.seendate || ''
		}));

		return { ...leader, news };
	} catch (error) {
		logger.warn('Leaders API', `Error fetching news for ${leader.name}:`, error);
		return { ...leader, news: [] };
	}
}

/**
 * Fetch news for all world leaders
 * Batches requests to avoid rate limits
 */
export async function fetchWorldLeaders(): Promise<WorldLeader[]> {
	const batchSize = 5;
	const results: WorldLeader[] = [];

	// Fetch in batches to avoid rate limits
	for (let i = 0; i < WORLD_LEADERS.length; i += batchSize) {
		const batch = WORLD_LEADERS.slice(i, i + batchSize);
		const batchResults = await Promise.allSettled(batch.map(fetchLeaderNews));

		for (const result of batchResults) {
			if (result.status === 'fulfilled') {
				results.push(result.value);
			}
		}

		// Small delay between batches
		if (i + batchSize < WORLD_LEADERS.length) {
			await new Promise((resolve) => setTimeout(resolve, 300));
		}
	}

	// Sort by news activity (leaders with more news first)
	return results.sort((a, b) => (b.news?.length || 0) - (a.news?.length || 0));
}

/**
 * OpenSanctions entity response
 */
interface OpenSanctionsEntity {
	id: string;
	caption: string;
	schema: string;
	properties: {
		name?: string[];
		position?: string[];
		country?: string[];
		birthDate?: string[];
		description?: string[];
	};
}

interface OpenSanctionsSearchResponse {
	results: OpenSanctionsEntity[];
	total: number;
}

/**
 * Search OpenSanctions for a leader by name
 * Returns updated position/title information if found
 */
export async function searchLeaderFromOpenSanctions(
	name: string
): Promise<OpenSanctionsEntity | null> {
	try {
		const url = `${OPENSANCTIONS_API}/search/${OPENSANCTIONS_DATASET}?q=${encodeURIComponent(name)}&limit=1`;
		const proxyUrl = CORS_PROXY_URL + encodeURIComponent(url);

		const response = await fetch(proxyUrl);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const data: OpenSanctionsSearchResponse = await response.json();
		if (data.results && data.results.length > 0) {
			return data.results[0];
		}
		return null;
	} catch (error) {
		logger.warn('OpenSanctions API', `Error searching for ${name}:`, error);
		return null;
	}
}

/**
 * Check if a leader's position has changed using OpenSanctions
 * Returns true if the leader is no longer in their expected position
 */
export async function checkLeaderPositionChange(leader: WorldLeader): Promise<boolean> {
	const entity = await searchLeaderFromOpenSanctions(leader.name);
	if (!entity) return false;

	// Check if the position matches
	const positions = entity.properties.position || [];
	const currentTitle = leader.title.toLowerCase();

	// If none of the positions match the expected title, position may have changed
	return !positions.some((pos) => pos.toLowerCase().includes(currentTitle));
}

/**
 * Fetch updated leader data from OpenSanctions for a specific country
 */
export async function fetchCountryLeaders(countryName: string): Promise<OpenSanctionsEntity[]> {
	try {
		const url = `${OPENSANCTIONS_API}/search/${OPENSANCTIONS_DATASET}?q=${encodeURIComponent(countryName)}&limit=10`;
		const proxyUrl = CORS_PROXY_URL + encodeURIComponent(url);

		const response = await fetch(proxyUrl);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const data: OpenSanctionsSearchResponse = await response.json();
		return data.results || [];
	} catch (error) {
		logger.warn('OpenSanctions API', `Error fetching leaders for ${countryName}:`, error);
		return [];
	}
}
