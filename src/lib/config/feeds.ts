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
		{ name: 'Reuters World', url: 'https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best' },
		{ name: 'AP News', url: 'https://apnews.com/hub/world-news/feed' },
		{ name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
		{ name: 'Foreign Affairs', url: 'https://www.foreignaffairs.com/rss.xml' },
		{ name: 'Foreign Policy', url: 'https://foreignpolicy.com/feed/' },
		// Twitter/X political analysts
		{ name: 'Reuters (𝕏)', url: 'https://nitter.net/Reuters/rss' },
		{ name: 'AP News (𝕏)', url: 'https://nitter.net/AP/rss' }
	],
	tech: [
		{ name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
		{ name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
		{ name: 'Wired', url: 'https://www.wired.com/feed/rss' }
	],
	finance: [
		{ name: 'Reuters Business', url: 'https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best' },
		{ name: 'FT', url: 'https://www.ft.com/rss/home' },
		{ name: 'Bloomberg', url: 'https://feeds.bloomberg.com/politics/news.rss' },
		{ name: 'The Economist', url: 'https://www.economist.com/the-world-this-week/rss.xml' }
	],
	gov: [
		{ name: 'White House', url: 'https://www.whitehouse.gov/news/feed/' },
		{ name: 'State Dept', url: 'https://www.state.gov/rss-feed/press-releases/feed/' },
		{ name: 'DoD News', url: 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?max=10&ContentType=1&Site=945' },
		{ name: 'NATO News', url: 'https://www.nato.int/cps/en/natohq/news.xml' },
		{ name: 'UN News', url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml' }
	],
	ai: [
		{ name: 'OpenAI Blog', url: 'https://openai.com/news/rss.xml' },
		{ name: 'ArXiv AI', url: 'https://rss.arxiv.org/rss/cs.AI' }
	],
	intel: [
		{ name: 'CSIS', url: 'https://www.csis.org/analysis/feed' },
		{ name: 'Brookings', url: 'https://www.brookings.edu/feed/' },
		{ name: 'CFR', url: 'https://www.cfr.org/rss.xml' },
		{ name: 'RAND', url: 'https://www.rand.org/blog.xml' },
		{ name: 'War on the Rocks', url: 'https://warontherocks.com/feed/' },
		{ name: 'Carnegie Endowment', url: 'https://carnegieendowment.org/rss/solr/?fa=experts' },
		// Twitter/X accounts via Nitter RSS
		{ name: 'ISW Analysis (𝕏)', url: 'https://nitter.net/TheStudyofWar/rss' },
		{ name: 'Bellingcat (𝕏)', url: 'https://nitter.net/bellingcat/rss' },
		{ name: 'War Monitor (𝕏)', url: 'https://nitter.net/WarMonitors/rss' }
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
		url: 'https://krebsonsecurity.com/feed/',
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
