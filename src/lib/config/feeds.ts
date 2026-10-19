/**
 * RSS feed and news source configuration
 */

import type { NewsCategory } from '$lib/types';

export interface FeedSource {
	name: string;
	url: string;
}

export interface IntelSource extends FeedSource {
	type: 'think-tank' | 'defense' | 'regional' | 'osint' | 'govt' | 'cyber';
	topics: string[];
	region?: string;
}

export const FEEDS: Record<NewsCategory, FeedSource[]> = {
	politics: [
		{ name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
		{ name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
		{ name: 'Foreign Affairs', url: 'https://www.foreignaffairs.com/rss.xml' },
		{ name: 'Foreign Policy', url: 'https://foreignpolicy.com/feed/' }
	],
	tech: [
		{
			name: 'Ars Technica',
			url: 'https://feeds.arstechnica.com/arstechnica/technology-lab'
		},
		{ name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
		{ name: 'Wired', url: 'https://www.wired.com/feed/rss' },
		{ name: 'Krebs on Security', url: 'https://www.krebsonsecurity.com/feed/' }
	],
	finance: [
		{
			name: 'Bloomberg Markets',
			url: 'https://feeds.bloomberg.com/markets/news.rss'
		},
		{
			name: 'BBC Business',
			url: 'https://feeds.bbci.co.uk/news/business/rss.xml'
		},
		{ name: 'FT', url: 'https://www.ft.com/rss/home' },
		{
			name: 'The Economist',
			url: 'https://www.economist.com/the-world-this-week/rss.xml'
		}
	],
	gov: [
		{ name: 'White House', url: 'https://www.whitehouse.gov/news/feed/' },
		{
			name: 'DoD News',
			url: 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?max=10&ContentType=1&Site=945'
		},
		{
			name: 'UN News',
			url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml'
		},
		{ name: 'CISA', url: 'https://www.cisa.gov/news.xml' }
	],
	ai: [
		{ name: 'OpenAI Blog', url: 'https://openai.com/news/rss.xml' },
		{ name: 'ArXiv AI', url: 'https://rss.arxiv.org/rss/cs.AI' }
	],
	intel: [
		{ name: 'War on the Rocks', url: 'https://warontherocks.com/feed/' },
		{ name: 'Atlantic Council', url: 'https://www.atlanticcouncil.org/feed/' },
		{ name: 'Defense One', url: 'https://www.defenseone.com/rss/all/' },
		{ name: 'Breaking Defense', url: 'https://breakingdefense.com/feed/' },
		{ name: 'Bellingcat', url: 'https://www.bellingcat.com/feed/' }
	]
};

export const INTEL_SOURCES: IntelSource[] = [
	{
		name: 'CSIS',
		url: 'https://www.csis.org/analysis/feed',
		type: 'think-tank',
		topics: ['defense', 'geopolitics']
	},
	{
		name: 'Brookings',
		url: 'https://www.brookings.edu/feed/',
		type: 'think-tank',
		topics: ['policy', 'geopolitics']
	},
	{
		name: 'CFR',
		url: 'https://www.cfr.org/rss.xml',
		type: 'think-tank',
		topics: ['foreign-policy']
	},
	{
		name: 'RAND Corporation',
		url: 'https://www.rand.org/blog.xml',
		type: 'think-tank',
		topics: ['defense', 'policy', 'security']
	},
	{
		name: 'Carnegie Endowment',
		url: 'https://carnegieendowment.org/rss/solr/?fa=experts',
		type: 'think-tank',
		topics: ['geopolitics', 'nuclear', 'russia', 'china']
	},
	{
		name: 'Atlantic Council',
		url: 'https://www.atlanticcouncil.org/feed/',
		type: 'think-tank',
		topics: ['nato', 'europe', 'russia']
	},
	{
		name: 'Chatham House',
		url: 'https://www.chathamhouse.org/rss.xml',
		type: 'think-tank',
		topics: ['uk', 'europe', 'geopolitics'],
		region: 'Europe'
	},
	{
		name: 'IISS',
		url: 'https://www.iiss.org/rss',
		type: 'think-tank',
		topics: ['defense', 'military', 'security']
	},
	{
		name: 'Defense One',
		url: 'https://www.defenseone.com/rss/all/',
		type: 'defense',
		topics: ['military', 'defense']
	},
	{
		name: 'War on the Rocks',
		url: 'https://warontherocks.com/feed/',
		type: 'defense',
		topics: ['military', 'strategy']
	},
	{
		name: 'Breaking Defense',
		url: 'https://breakingdefense.com/feed/',
		type: 'defense',
		topics: ['military', 'defense']
	},
	{
		name: 'The Drive War Zone',
		url: 'https://www.thedrive.com/the-war-zone/feed',
		type: 'defense',
		topics: ['military']
	},
	{
		name: 'Janes',
		url: 'https://www.janes.com/feeds/news',
		type: 'defense',
		topics: ['military', 'defense', 'intelligence']
	},
	{
		name: 'The Diplomat',
		url: 'https://thediplomat.com/feed/',
		type: 'regional',
		topics: ['asia-pacific', 'china', 'japan'],
		region: 'APAC'
	},
	{
		name: 'Al-Monitor',
		url: 'https://www.al-monitor.com/rss',
		type: 'regional',
		topics: ['middle-east', 'iran', 'israel'],
		region: 'MENA'
	},
	{
		name: 'Al Jazeera',
		url: 'https://www.aljazeera.com/xml/rss/all.xml',
		type: 'regional',
		topics: ['middle-east', 'global'],
		region: 'MENA'
	},
	{
		name: 'Eurasia Review',
		url: 'https://www.eurasiareview.com/feed/',
		type: 'regional',
		topics: ['central-asia', 'russia', 'china'],
		region: 'Eurasia'
	},
	{
		name: 'Bellingcat',
		url: 'https://www.bellingcat.com/feed/',
		type: 'osint',
		topics: ['investigation', 'osint', 'russia', 'ukraine']
	},
	{
		name: 'Oryx',
		url: 'https://www.oryxspioenkop.com/feeds/posts/default',
		type: 'osint',
		topics: ['military', 'equipment', 'losses']
	},
	{
		name: 'ISW',
		url: 'https://www.understandingwar.org/rss.xml',
		type: 'osint',
		topics: ['ukraine', 'russia', 'military', 'conflict']
	},
	{
		name: 'CISA Alerts',
		url: 'https://www.cisa.gov/uscert/ncas/alerts.xml',
		type: 'cyber',
		topics: ['cyber', 'security']
	},
	{
		name: 'Krebs Security',
		url: 'https://www.krebsonsecurity.com/feed/',
		type: 'cyber',
		topics: ['cyber', 'security']
	},
	{
		name: 'Recorded Future',
		url: 'https://www.recordedfuture.com/feed',
		type: 'cyber',
		topics: ['cyber', 'threat-intelligence']
	}
];
