/**
 * Tweets/X Feed API - Fetch tweets from various sources
 */

import type { NewsItem } from '$lib/types';
import { logger } from '$lib/config/api';

interface TwitterAccount {
	handle: string;
	displayName: string;
	color: string;
	icon: string;
}

const TWITTER_ACCOUNTS: Record<string, TwitterAccount> = {
	TheStudyofWar: {
		handle: '@TheStudyofWar',
		displayName: 'ISW Analysis (𝕏)',
		color: '#FF0000',
		icon: '🎯'
	},
	bellingcat: {
		handle: '@bellingcat',
		displayName: 'Bellingcat (𝕏)',
		color: '#1DA1F2',
		icon: '🔍'
	},
	WarMonitors: {
		handle: '@WarMonitors',
		displayName: 'War Monitor (𝕏)',
		color: '#FF6B35',
		icon: '⚔️'
	},
	Reuters: {
		handle: '@Reuters',
		displayName: 'Reuters (𝕏)',
		color: '#FF8000',
		icon: '📰'
	},
	AP: {
		handle: '@AP',
		displayName: 'AP News (𝕏)',
		color: '#002868',
		icon: '📡'
	},
	elonmusk: {
		handle: '@elonmusk',
		displayName: 'Elon Musk (𝕏)',
		color: '#00A9FF',
		icon: '🚀'
	}
};

/**
 * Fetch tweets from a specific account using a simple scraper or API
 */
async function fetchAccountTweets(accountHandle: string): Promise<NewsItem[]> {
	try {
		logger.log('Tweets API', `Fetching tweets for ${accountHandle}`);

		// Try using a public Twitter/X alternative API or scraper
		// Using a simple approach with x.com direct links for now
		const account = TWITTER_ACCOUNTS[accountHandle];
		if (!account) {
			logger.warn('Tweets API', `Unknown account: ${accountHandle}`);
			return [];
		}

		// Since direct Twitter API requires auth and RSS is unreliable,
		// we'll use a simpler approach with x.com profile pages or a free tweet scraper
		// For now, return empty array until we have a working API
		return [];
	} catch (error) {
		logger.error('Tweets API', `Error fetching tweets for ${accountHandle}:`, error);
		return [];
	}
}

/**
 * Fetch all tweets from configured accounts
 */
export async function fetchAllTweets(): Promise<NewsItem[]> {
	try {
		const accountHandles = Object.keys(TWITTER_ACCOUNTS);
		const tweetPromises = accountHandles.map((handle) => fetchAccountTweets(handle));
		const results = await Promise.all(tweetPromises);
		const tweets = results.flat();

		// Sort by timestamp, most recent first
		return tweets.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
	} catch (error) {
		logger.error('Tweets API', 'Error fetching all tweets:', error);
		return [];
	}
}

/**
 * Generate demo tweets for development
 */
export function generateDemoTweets(): NewsItem[] {
	const now = Date.now();
	const demoTweets: NewsItem[] = [
		{
			id: 'tweet-1',
			title: 'New geopolitical analysis on regional security implications',
			link: 'https://x.com/TheStudyofWar/status/demo1',
			source: 'ISW Analysis (𝕏)',
			category: 'intel',
			timestamp: now - 30 * 60 * 1000, // 30 mins ago
			pubDate: new Date(now - 30 * 60 * 1000).toISOString(),
			isAlert: true,
			topics: ['geopolitics', 'security']
		},
		{
			id: 'tweet-2',
			title: 'Intelligence investigation reveals new evidence in ongoing conflict',
			link: 'https://x.com/bellingcat/status/demo2',
			source: 'Bellingcat (𝕏)',
			category: 'intel',
			timestamp: now - 45 * 60 * 1000, // 45 mins ago
			pubDate: new Date(now - 45 * 60 * 1000).toISOString(),
			isAlert: false,
			topics: ['investigation', 'intelligence']
		},
		{
			id: 'tweet-3',
			title: 'Military situation update: Latest developments in strategic region',
			link: 'https://x.com/WarMonitors/status/demo3',
			source: 'War Monitor (𝕏)',
			category: 'intel',
			timestamp: now - 1 * 60 * 60 * 1000, // 1 hour ago
			pubDate: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
			isAlert: true,
			topics: ['military', 'conflict']
		},
		{
			id: 'tweet-4',
			title: 'Global markets respond to major international policy announcement',
			link: 'https://x.com/Reuters/status/demo4',
			source: 'Reuters (𝕏)',
			category: 'finance',
			timestamp: now - 90 * 60 * 1000, // 1.5 hours ago
			pubDate: new Date(now - 90 * 60 * 1000).toISOString(),
			isAlert: false,
			topics: ['markets', 'policy']
		},
		{
			id: 'tweet-5',
			title: 'Breaking news: Major developments in ongoing situation',
			link: 'https://x.com/AP/status/demo5',
			source: 'AP News (𝕏)',
			category: 'politics',
			timestamp: now - 120 * 60 * 1000, // 2 hours ago
			pubDate: new Date(now - 120 * 60 * 1000).toISOString(),
			isAlert: true,
			topics: ['news', 'breaking']
		},
		{
			id: 'tweet-6',
			title: 'Technology innovation shaping future of critical infrastructure',
			link: 'https://x.com/elonmusk/status/demo6',
			source: 'Elon Musk (𝕏)',
			category: 'tech',
			timestamp: now - 2 * 60 * 60 * 1000, // 2 hours ago
			pubDate: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
			isAlert: false,
			topics: ['technology', 'infrastructure']
		}
	];

	return demoTweets;
}
