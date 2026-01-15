/**
 * Countries API - Fetch country-specific news and data
 */

import type { NewsItem } from '$lib/types';
import { fetchWithProxy, logger } from '$lib/config/api';
import { containsAlertKeyword, detectTopics } from '$lib/config/keywords';

/**
 * Simple hash function to generate unique IDs from URLs
 */
function hashCode(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(36);
}

/**
 * Parse GDELT date format (20251202T224500Z) to valid Date
 */
function parseGdeltDate(dateStr: string): Date {
	if (!dateStr) return new Date();
	const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
	if (match) {
		const [, year, month, day, hour, min, sec] = match;
		return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`);
	}
	return new Date(dateStr);
}

interface GdeltArticle {
	title: string;
	url: string;
	seendate: string;
	domain: string;
	socialimage?: string;
}

interface GdeltResponse {
	articles?: GdeltArticle[];
}

/**
 * Transform GDELT article to NewsItem for country news
 */
function transformGdeltArticle(
	article: GdeltArticle,
	countryName: string,
	index: number
): NewsItem {
	const title = article.title || '';
	const alert = containsAlertKeyword(title);
	const urlHash = article.url ? hashCode(article.url) : Math.random().toString(36).slice(2);
	const uniqueId = `country-${countryName}-${urlHash}-${index}`;

	const parsedDate = parseGdeltDate(article.seendate);

	return {
		id: uniqueId,
		title,
		link: article.url,
		pubDate: article.seendate,
		timestamp: parsedDate.getTime(),
		source: article.domain || 'Unknown',
		category: 'intel', // Use intel as default category for country news
		isAlert: !!alert,
		alertKeyword: alert?.keyword || undefined,
		region: countryName,
		topics: detectTopics(title)
	};
}

/**
 * Fetch news for a specific country using GDELT
 */
export async function fetchCountryNews(countryName: string): Promise<NewsItem[]> {
	try {
		// Build GDELT query for the country
		const query = `"${countryName}" sourcelang:english`;
		const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&timespan=7d&mode=artlist&maxrecords=50&format=json&sort=date`;

		logger.log('Countries API', `Fetching news for ${countryName}`);

		const response = await fetchWithProxy(gdeltUrl);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const contentType = response.headers.get('content-type');
		if (!contentType?.includes('application/json')) {
			logger.warn('Countries API', `Non-JSON response for ${countryName}:`, contentType);
			return [];
		}

		const text = await response.text();
		let data: GdeltResponse;
		try {
			data = JSON.parse(text);
		} catch {
			logger.warn('Countries API', `Invalid JSON for ${countryName}:`, text.slice(0, 100));
			return [];
		}

		if (!data?.articles) return [];

		return data.articles.map((article, index) =>
			transformGdeltArticle(article, countryName, index)
		);
	} catch (error) {
		logger.error('Countries API', `Error fetching news for ${countryName}:`, error);
		return [];
	}
}
