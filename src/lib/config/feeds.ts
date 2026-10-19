/**
 * RSS feed and news source configuration
 */

import type { NewsCategory } from '$lib/types';

export interface FeedSource {
	name: string;
	url: string;
}

export const FEEDS: Record<NewsCategory, FeedSource[]> = {
	politics: [
		{ name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
		{ name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
		{ name: 'Foreign Affairs', url: 'https://www.foreignaffairs.com/rss.xml' },
		{ name: 'Foreign Policy', url: 'https://foreignpolicy.com/feed/' }
	],
	tech: [
		{ name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
		{ name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
		{ name: 'Wired', url: 'https://www.wired.com/feed/rss' }
	],
	finance: [
		{ name: 'FT', url: 'https://www.ft.com/rss/home' },
		{ name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss' },
		{ name: 'The Economist', url: 'https://www.economist.com/finance-and-economics/rss.xml' }
	],
	gov: [
		{ name: 'White House', url: 'https://www.whitehouse.gov/news/feed/' },
		{
			name: 'DoD News',
			url: 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?max=10&ContentType=1&Site=945'
		},
		{ name: 'UN News', url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml' },
		{ name: 'CISA Advisories', url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml' }
	],
	ai: [
		{ name: 'OpenAI Blog', url: 'https://openai.com/news/rss.xml' },
		{ name: 'ArXiv AI', url: 'https://export.arxiv.org/rss/cs.AI' }
	],
	intel: [
		{ name: 'Brookings', url: 'https://www.brookings.edu/feed/?post_type=article' },
		{ name: 'CFR', url: 'https://www.cfr.org/feed' },
		{ name: 'War on the Rocks', url: 'https://warontherocks.com/feed/' },
		{ name: 'Atlantic Council', url: 'https://www.atlanticcouncil.org/feed/' },
		{ name: 'Defense One', url: 'https://www.defenseone.com/rss/all/' },
		{ name: 'Breaking Defense', url: 'https://breakingdefense.com/feed/' },
		{ name: 'Bellingcat', url: 'https://www.bellingcat.com/feed/' }
	]
};
