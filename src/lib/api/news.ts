/**
 * News API - Fetch news from GDELT and other sources
 */

import { FEEDS } from '$lib/config/feeds';
import type { NewsItem, NewsCategory } from '$lib/types';
import { containsAlertKeyword, detectRegion, detectTopics } from '$lib/config/keywords';
import { fetchWithProxy, API_DELAYS, logger } from '$lib/config/api';

/**
 * Simple hash function to generate unique IDs from URLs
 */
function hashCode(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return Math.abs(hash).toString(36);
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse GDELT date format (20251202T224500Z) to valid Date
 */
function parseGdeltDate(dateStr: string): Date {
	if (!dateStr) return new Date();
	// Convert 20251202T224500Z to 2025-12-02T22:45:00Z
	const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
	if (match) {
		const [, year, month, day, hour, min, sec] = match;
		return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`);
	}
	// Fallback to standard parsing
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
 * Parse RSS XML and extract items
 */
function parseRssXml(xml: string, sourceName: string, category: NewsCategory): NewsItem[] {
	const items: NewsItem[] = [];

	// Simple regex-based XML parsing for RSS items
	const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
	const titleRegex = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i;
	const linkRegex = /<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i;
	const descRegex = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i;
	const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/i;

	let match;
	let index = 0;
	while ((match = itemRegex.exec(xml)) !== null) {
		const itemXml = match[1];

		const titleMatch = titleRegex.exec(itemXml);
		const linkMatch = linkRegex.exec(itemXml);
		const descMatch = descRegex.exec(itemXml);
		const pubDateMatch = pubDateRegex.exec(itemXml);

		const title = titleMatch?.[1]?.trim() || '';
		const link = linkMatch?.[1]?.trim() || '';
		const description = descMatch?.[1]?.trim().replace(/<[^>]*>/g, '') || '';
		const pubDate = pubDateMatch?.[1]?.trim() || '';

		if (!title || !link) continue;

		const alert = containsAlertKeyword(title);
		const urlHash = link ? hashCode(link) : Math.random().toString(36).slice(2);
		const uniqueId = `rss-${category}-${urlHash}-${index}`;

		items.push({
			id: uniqueId,
			title,
			link: link.startsWith('http') ? link : `https://${link}`,
			source: sourceName,
			category,
			isAlert: !!alert,
			alertKeyword: alert?.keyword || undefined,
			region: detectRegion(title) ?? undefined,
			topics: detectTopics(title),
			description: description || undefined,
			pubDate,
			timestamp: pubDate ? new Date(pubDate).getTime() : Date.now()
		});

		index++;
	}

	return items;
}

/**
 * Fetch a single RSS feed
 */
async function fetchRssFeed(url: string, sourceName: string, category: NewsCategory): Promise<NewsItem[]> {
	try {
		logger.log('RSS Feed', `Fetching ${sourceName} from ${url}`);
		const response = await fetchWithProxy(url);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const xml = await response.text();
		return parseRssXml(xml, sourceName, category);
	} catch (error) {
		logger.warn('RSS Feed', `Error fetching ${sourceName}:`, error);
		return [];
	}
}

/**
 * Transform GDELT article to NewsItem
 */
function transformGdeltArticle(
	article: GdeltArticle,
	category: NewsCategory,
	source: string,
	index: number
): NewsItem {
	const title = article.title || '';
	const alert = containsAlertKeyword(title);
	// Generate unique ID using category, URL hash, and index
	const urlHash = article.url ? hashCode(article.url) : Math.random().toString(36).slice(2);
	const uniqueId = `gdelt-${category}-${urlHash}-${index}`;

	const parsedDate = parseGdeltDate(article.seendate);

	return {
		id: uniqueId,
		title,
		link: article.url,
		pubDate: article.seendate,
		timestamp: parsedDate.getTime(),
		source: source || article.domain || 'Unknown',
		category,
		isAlert: !!alert,
		alertKeyword: alert?.keyword || undefined,
		region: detectRegion(title) ?? undefined,
		topics: detectTopics(title)
	};
}

/**
 * Fetch news for a specific category using GDELT and RSS feeds
 */
export async function fetchCategoryNews(category: NewsCategory): Promise<NewsItem[]> {
	// Build query from category keywords (GDELT requires OR queries in parentheses)
	const categoryQueries: Record<NewsCategory, string> = {
		politics: '(diplomacy OR "foreign policy" OR "international relations" OR summit OR treaty OR sanctions OR "bilateral talks")',
		tech: '(technology OR cybersecurity OR "cyber attack" OR infrastructure OR "critical systems")',
		finance: '(sanctions OR "trade war" OR tariff OR "economic policy" OR "central bank" OR "currency crisis")',
		gov: '(government OR "state department" OR pentagon OR "defense ministry" OR NATO OR "united nations")',
		ai: '("artificial intelligence" OR "machine learning" OR AI OR "autonomous weapons")',
		intel: '(military OR "armed forces" OR conflict OR war OR "intelligence agency" OR espionage OR "security threat" OR geopolitics)'
	};

	let gdeltArticles: NewsItem[] = [];

	try {
		// Add English language filter and timespan for fresh results
		const baseQuery = categoryQueries[category];
		const fullQuery = `${baseQuery} sourcelang:english`;
		// Build the raw GDELT URL with timespan=7d to get recent articles
		const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${fullQuery}&timespan=7d&mode=artlist&maxrecords=20&format=json&sort=date`;

		logger.log('News API', `Fetching ${category} from GDELT`);

		const response = await fetchWithProxy(gdeltUrl);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		// Check content type before parsing as JSON
		const contentType = response.headers.get('content-type');
		if (!contentType?.includes('application/json')) {
			logger.warn('News API', `Non-JSON response for ${category}:`, contentType);
		} else {
			const text = await response.text();
			let data: GdeltResponse;
			try {
				data = JSON.parse(text);
			} catch {
				logger.warn('News API', `Invalid JSON for ${category}:`, text.slice(0, 100));
			}

			if (data?.articles) {
				// Get source names for this category
				const categoryFeeds = FEEDS[category] || [];
				const defaultSource = categoryFeeds[0]?.name || 'News';

				gdeltArticles = data.articles.map((article, index) =>
					transformGdeltArticle(article, category, article.domain || defaultSource, index)
				);
			}
		}
	} catch (error) {
		logger.error('News API', `Error fetching ${category} from GDELT:`, error);
	}

	// Fetch RSS feeds for this category
	let rssArticles: NewsItem[] = [];
	try {
		const categoryFeeds = FEEDS[category] || [];
		const rssFeedPromises = categoryFeeds.map((feed) =>
			fetchRssFeed(feed.url, feed.name, category)
		);
		const rssResults = await Promise.all(rssFeedPromises);
		rssArticles = rssResults.flat();
	} catch (error) {
		logger.warn('News API', `Error fetching RSS feeds for ${category}:`, error);
	}

	// Combine GDELT and RSS results, sorted by timestamp
	return [...gdeltArticles, ...rssArticles].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

/** All news categories in fetch order */
const NEWS_CATEGORIES: NewsCategory[] = ['politics', 'tech', 'finance', 'gov', 'ai', 'intel'];

/** Create an empty news result object */
function createEmptyNewsResult(): Record<NewsCategory, NewsItem[]> {
	return { politics: [], tech: [], finance: [], gov: [], ai: [], intel: [] };
}

/**
 * Fetch all news - sequential with delays to avoid rate limiting
 */
export async function fetchAllNews(): Promise<Record<NewsCategory, NewsItem[]>> {
	const result = createEmptyNewsResult();

	for (let i = 0; i < NEWS_CATEGORIES.length; i++) {
		const category = NEWS_CATEGORIES[i];

		if (i > 0) {
			await delay(API_DELAYS.betweenCategories);
		}

		result[category] = await fetchCategoryNews(category);
	}

	return result;
}
