/**
 * Sentiment Analysis - analyzes headlines for emotional tone and geopolitical implications
 */

import type { NewsItem } from '$lib/types';

export type SentimentType = 'positive' | 'negative' | 'neutral' | 'critical' | 'alarming';

export interface HeadlineSentiment {
	headline: NewsItem;
	sentiment: SentimentType;
	score: number; // -1 to 1
	keywords: string[];
	category: string;
}

export interface SentimentSummary {
	overall: SentimentType;
	overallScore: number;
	distribution: {
		positive: number;
		negative: number;
		neutral: number;
		critical: number;
		alarming: number;
	};
	topHeadlines: HeadlineSentiment[];
	themes: Array<{ theme: string; count: number; sentiment: SentimentType }>;
}

// Geopolitically-focused sentiment keywords
const SENTIMENT_KEYWORDS = {
	alarming: [
		'war', 'invasion', 'attack', 'bomb', 'missile', 'nuclear', 'strike', 'killed',
		'casualties', 'emergency', 'crisis', 'collapse', 'catastrophe', 'disaster',
		'threat', 'weapons', 'troops', 'military action', 'escalation', 'conflict',
		'assassination', 'coup', 'martial law', 'genocide', 'massacre'
	],
	critical: [
		'sanctions', 'tensions', 'clash', 'dispute', 'warning', 'denounce', 'condemn',
		'deadline', 'ultimatum', 'withdraw', 'suspension', 'expel', 'protest', 'riot',
		'unrest', 'instability', 'confrontation', 'standoff', 'brink', 'deteriorating',
		'breakdown', 'failed', 'rejected', 'veto', 'hostile'
	],
	negative: [
		'decline', 'fall', 'drop', 'loss', 'fail', 'cut', 'concern', 'worry', 'fear',
		'delay', 'setback', 'struggle', 'challenge', 'problem', 'issue', 'downturn',
		'recession', 'inflation', 'deficit', 'debt', 'layoff', 'shutdown'
	],
	positive: [
		'peace', 'agreement', 'deal', 'treaty', 'cooperation', 'alliance', 'progress',
		'success', 'growth', 'rise', 'gain', 'improve', 'breakthrough', 'resolution',
		'ceasefire', 'summit', 'partnership', 'aid', 'support', 'stability', 'reform',
		'recovery', 'boost', 'surge', 'record high'
	],
	neutral: [
		'announce', 'report', 'says', 'plan', 'consider', 'discuss', 'meet', 'visit',
		'statement', 'review', 'analysis', 'update', 'schedule', 'propose'
	]
};

// Geopolitical theme detection
const GEOPOLITICAL_THEMES = {
	'US-China': ['china', 'beijing', 'xi jinping', 'taiwan', 'south china sea', 'us-china', 'trade war'],
	'Russia-Ukraine': ['russia', 'ukraine', 'putin', 'zelensky', 'kremlin', 'kyiv', 'crimea', 'donbas'],
	'Middle East': ['israel', 'gaza', 'iran', 'saudi', 'syria', 'yemen', 'hamas', 'hezbollah', 'netanyahu'],
	'NATO/Europe': ['nato', 'eu', 'european union', 'brussels', 'germany', 'france', 'uk'],
	'North Korea': ['north korea', 'pyongyang', 'kim jong', 'dprk', 'korean peninsula'],
	'Indo-Pacific': ['india', 'japan', 'australia', 'asean', 'quad', 'indo-pacific'],
	'Africa': ['africa', 'sahel', 'ethiopia', 'sudan', 'libya', 'african union'],
	'Latin America': ['venezuela', 'brazil', 'mexico', 'cuba', 'argentina', 'latin america'],
	'Energy': ['oil', 'gas', 'opec', 'energy', 'pipeline', 'lng', 'petroleum'],
	'Nuclear': ['nuclear', 'uranium', 'iaea', 'nonproliferation', 'atomic'],
	'Cyber': ['cyber', 'hack', 'ransomware', 'data breach', 'cyber attack'],
	'Climate': ['climate', 'emissions', 'carbon', 'cop', 'environmental']
};

/**
 * Analyze sentiment of a single headline
 */
function analyzeHeadline(item: NewsItem): HeadlineSentiment {
	const title = (item.title || '').toLowerCase();
	const foundKeywords: string[] = [];
	let score = 0;
	let sentiment: SentimentType = 'neutral';

	// Check each sentiment category
	const scores: Record<SentimentType, number> = {
		alarming: 0,
		critical: 0,
		negative: 0,
		positive: 0,
		neutral: 0
	};

	for (const [sentimentKey, keywords] of Object.entries(SENTIMENT_KEYWORDS)) {
		for (const keyword of keywords) {
			if (title.includes(keyword)) {
				scores[sentimentKey as SentimentType]++;
				foundKeywords.push(keyword);
			}
		}
	}

	// Determine dominant sentiment
	if (scores.alarming >= 1) {
		sentiment = 'alarming';
		score = -1;
	} else if (scores.critical >= 1) {
		sentiment = 'critical';
		score = -0.7;
	} else if (scores.negative > scores.positive) {
		sentiment = 'negative';
		score = -0.4;
	} else if (scores.positive > scores.negative) {
		sentiment = 'positive';
		score = 0.5;
	} else {
		sentiment = 'neutral';
		score = 0;
	}

	// Detect category/theme
	let category = 'General';
	for (const [theme, keywords] of Object.entries(GEOPOLITICAL_THEMES)) {
		if (keywords.some(kw => title.includes(kw))) {
			category = theme;
			break;
		}
	}

	return {
		headline: item,
		sentiment,
		score,
		keywords: foundKeywords.slice(0, 5),
		category
	};
}

/**
 * Analyze top headlines and return sentiment summary
 */
export function analyzeSentiment(news: NewsItem[], limit: number = 20): SentimentSummary | null {
	if (!news || news.length === 0) return null;

	// Sort by timestamp (most recent first) and take top headlines
	const sortedNews = [...news]
		.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
		.slice(0, limit);

	const analyzed = sortedNews.map(analyzeHeadline);

	// Calculate distribution
	const distribution = {
		positive: 0,
		negative: 0,
		neutral: 0,
		critical: 0,
		alarming: 0
	};

	let totalScore = 0;
	const themeCounts: Record<string, { count: number; scores: number[] }> = {};

	for (const item of analyzed) {
		distribution[item.sentiment]++;
		totalScore += item.score;

		if (!themeCounts[item.category]) {
			themeCounts[item.category] = { count: 0, scores: [] };
		}
		themeCounts[item.category].count++;
		themeCounts[item.category].scores.push(item.score);
	}

	// Calculate overall sentiment
	const avgScore = totalScore / analyzed.length;
	let overall: SentimentType;
	if (avgScore <= -0.6) overall = 'alarming';
	else if (avgScore <= -0.3) overall = 'critical';
	else if (avgScore < -0.1) overall = 'negative';
	else if (avgScore > 0.2) overall = 'positive';
	else overall = 'neutral';

	// Build theme summary with sentiment
	const themes = Object.entries(themeCounts)
		.filter(([theme]) => theme !== 'General')
		.map(([theme, data]) => {
			const avgThemeScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
			let themeSentiment: SentimentType;
			if (avgThemeScore <= -0.6) themeSentiment = 'alarming';
			else if (avgThemeScore <= -0.3) themeSentiment = 'critical';
			else if (avgThemeScore < -0.1) themeSentiment = 'negative';
			else if (avgThemeScore > 0.2) themeSentiment = 'positive';
			else themeSentiment = 'neutral';

			return { theme, count: data.count, sentiment: themeSentiment };
		})
		.sort((a, b) => b.count - a.count)
		.slice(0, 6);

	return {
		overall,
		overallScore: avgScore,
		distribution,
		topHeadlines: analyzed,
		themes
	};
}

/**
 * Get sentiment color for UI
 */
export function getSentimentColor(sentiment: SentimentType): string {
	switch (sentiment) {
		case 'alarming': return '#ff4444';
		case 'critical': return '#ff8800';
		case 'negative': return '#ffaa44';
		case 'positive': return '#44cc66';
		case 'neutral': return '#888888';
	}
}

/**
 * Get sentiment emoji for display
 */
export function getSentimentEmoji(sentiment: SentimentType): string {
	switch (sentiment) {
		case 'alarming': return '🔴';
		case 'critical': return '🟠';
		case 'negative': return '🟡';
		case 'positive': return '🟢';
		case 'neutral': return '⚪';
	}
}
