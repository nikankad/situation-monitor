/**
 * News API - Fetch news from GDELT and other sources
 */

import { FEEDS } from '$lib/config/feeds';
import type { NewsItem, NewsCategory } from '$lib/types';
import { containsAlertKeyword, detectRegion, detectTopics } from '$lib/config/keywords';
import { fetchWithProxy, logger } from '$lib/config/api';
import { sanitizeHtml, sanitizeArticleTitle } from '$lib/services/security';
import { browser } from '$app/environment';
import { fetchGdeltArticles, type GdeltArticle } from './gdelt';

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

/**
 * Extract text from CDATA or HTML-encoded content
 * Handles both <![CDATA[...]]> and HTML entities
 */
function extractXmlText(content: string): string {
	if (!content) return '';

	let text = content.trim();

	// Remove CDATA wrappers if present
	const cdataMatch = text.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
	if (cdataMatch) {
		text = cdataMatch[1];
	}

	// Decode HTML entities
	let decoded = text;
	if (browser) {
		const textarea = document.createElement('textarea');
		textarea.innerHTML = text;
		decoded = textarea.value;
	} else {
		// Server-side: Simple HTML entity decoding
		decoded = text
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'");
	}

	return decoded.trim();
}

/**
 * Parse RSS XML and extract items
 * Uses regex-based parsing for compatibility with RSS 2.0 feeds
 * Properly handles CDATA sections and sanitizes HTML content
 */
function parseRssXml(xml: string, sourceName: string, category: NewsCategory): NewsItem[] {
	const items: NewsItem[] = [];

	// Regex-based XML parsing for RSS items
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

		// Extract and sanitize title
		const rawTitle = titleMatch?.[1] || '';
		const title = sanitizeArticleTitle(extractXmlText(rawTitle));

		// Extract and validate link
		const link = extractXmlText(linkMatch?.[1] || '').trim();

		// Extract and sanitize description (remove HTML, preserve text)
		const rawDesc = descMatch?.[1] || '';
		const extractedDesc = extractXmlText(rawDesc);
		const description = sanitizeHtml(extractedDesc);

		const pubDate = extractXmlText(pubDateMatch?.[1] || '');

		if (!title || !link) continue;

		const alert = containsAlertKeyword(title);
		const urlHash = link ? hashCode(link) : Math.random().toString(36).slice(2);
		const uniqueId = `rss-${category}-${urlHash}-${index}`;

		// Parse timestamp, use current time if invalid
		let timestamp = Date.now();
		if (pubDate) {
			const parsedTime = new Date(pubDate).getTime();
			timestamp = !isNaN(parsedTime) ? parsedTime : Date.now();
		}

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
			timestamp
		});

		index++;
	}

	return items;
}

/**
 * Fetch a single RSS feed
 */
async function fetchRssFeed(
	url: string,
	sourceName: string,
	category: NewsCategory
): Promise<NewsItem[]> {
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
	// Use current time if date parsing fails
	const timestamp = isNaN(parsedDate.getTime()) ? Date.now() : parsedDate.getTime();

	return {
		id: uniqueId,
		title,
		link: article.url,
		pubDate: article.seendate,
		timestamp,
		source: source || article.domain || 'Unknown',
		category,
		isAlert: !!alert,
		alertKeyword: alert?.keyword || undefined,
		region: detectRegion(title) ?? undefined,
		topics: detectTopics(title)
	};
}

const GDELT_CATEGORY_QUERIES: Record<NewsCategory, string> = {
	politics:
		'(diplomacy OR "foreign policy" OR "international relations" OR summit OR treaty OR sanctions OR "bilateral talks")',
	tech: '(technology OR cybersecurity OR "cyber attack" OR infrastructure OR "critical systems")',
	finance:
		'(sanctions OR "trade war" OR tariff OR "economic policy" OR "central bank" OR "currency crisis")',
	gov: '(government OR "state department" OR pentagon OR "defense ministry" OR NATO OR "united nations")',
	ai: '("artificial intelligence" OR "machine learning" OR AI OR "autonomous weapons")',
	intel:
		'(military OR "armed forces" OR conflict OR war OR "intelligence agency" OR espionage OR "security threat" OR geopolitics)'
};

/**
 * Fetch recent articles for a category from GDELT (rate limited, see ./gdelt)
 */
async function fetchGdeltNews(category: NewsCategory): Promise<NewsItem[]> {
	try {
		logger.log('News API', `Fetching ${category} from GDELT`);
		const articles = await fetchGdeltArticles({
			query: GDELT_CATEGORY_QUERIES[category],
			timespan: '3d',
			maxRecords: 50
		});
		const defaultSource = FEEDS[category]?.[0]?.name || 'News';
		return articles.map((article, index) =>
			transformGdeltArticle(article, category, article.domain || defaultSource, index)
		);
	} catch (error) {
		logger.warn('News API', `Error fetching ${category} from GDELT:`, error);
		return [];
	}
}

/**
 * Fetch all RSS feeds configured for a category
 */
async function fetchRssNews(category: NewsCategory): Promise<NewsItem[]> {
	const results = await Promise.all(
		(FEEDS[category] || []).map((feed) => fetchRssFeed(feed.url, feed.name, category))
	);
	return results.flat();
}

/**
 * Combine sources, drop articles older than 30 days and sort newest first
 */
function mergeNews(...sources: NewsItem[][]): NewsItem[] {
	const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
	return sources
		.flat()
		.filter((article) => (article.timestamp || 0) >= thirtyDaysAgo)
		.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

/**
 * Fetch news for a specific category using GDELT and RSS feeds
 */
export async function fetchCategoryNews(category: NewsCategory): Promise<NewsItem[]> {
	const [gdeltArticles, rssArticles] = await Promise.all([
		fetchGdeltNews(category),
		fetchRssNews(category)
	]);
	return mergeNews(gdeltArticles, rssArticles);
}

/** All news categories in fetch order */
const NEWS_CATEGORIES: NewsCategory[] = ['politics', 'tech', 'finance', 'gov', 'ai', 'intel'];

/**
 * Fetch all news.
 *
 * RSS feeds for every category are fetched in parallel and returned as soon as they
 * are in. GDELT is limited to one request every few seconds, so its articles are
 * merged in afterwards, one category at a time, and reported through `onUpdate`
 * with the full merged result. Without `onUpdate` the GDELT pass is awaited.
 */
export async function fetchAllNews(
	onUpdate?: (data: Record<NewsCategory, NewsItem[]>) => void
): Promise<Record<NewsCategory, NewsItem[]>> {
	const rss = await Promise.all(NEWS_CATEGORIES.map((category) => fetchRssNews(category)));

	const rssByCategory = {} as Record<NewsCategory, NewsItem[]>;
	const result = {} as Record<NewsCategory, NewsItem[]>;
	NEWS_CATEGORIES.forEach((category, i) => {
		rssByCategory[category] = rss[i];
		result[category] = mergeNews(rss[i]);
	});

	const addGdelt = async () => {
		for (const category of NEWS_CATEGORIES) {
			const gdeltArticles = await fetchGdeltNews(category);
			if (gdeltArticles.length === 0) continue;
			result[category] = mergeNews(gdeltArticles, rssByCategory[category]);
			onUpdate?.({ ...result });
		}
	};

	if (onUpdate) {
		void addGdelt();
		return { ...result };
	}

	await addGdelt();
	return result;
}
