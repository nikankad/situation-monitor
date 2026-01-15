/**
 * Correlation engine - analyzes patterns across news items
 */

import type { NewsItem } from '$lib/types';
import { CORRELATION_TOPICS, type CorrelationTopic } from '$lib/config/analysis';

// Types for correlation results
export interface EmergingPattern {
	id: string;
	name: string;
	category: string;
	count: number;
	level: 'high' | 'elevated' | 'emerging';
	sources: string[];
	headlines: Array<{ title: string; link: string; source: string }>;
}

export interface MomentumSignal {
	id: string;
	name: string;
	category: string;
	current: number;
	delta: number;
	momentum: 'surging' | 'rising' | 'stable';
	headlines: Array<{ title: string; link: string; source: string }>;
}

export interface CrossSourceCorrelation {
	id: string;
	name: string;
	category: string;
	sourceCount: number;
	sources: string[];
	level: 'high' | 'elevated' | 'emerging';
	headlines: Array<{ title: string; link: string; source: string }>;
}

export interface PredictiveSignal {
	id: string;
	name: string;
	category: string;
	score: number;
	confidence: number;
	prediction: string;
	level: 'high' | 'medium' | 'low';
	headlines: Array<{ title: string; link: string; source: string }>;
}

export interface CorrelationResults {
	emergingPatterns: EmergingPattern[];
	momentumSignals: MomentumSignal[];
	crossSourceCorrelations: CrossSourceCorrelation[];
	predictiveSignals: PredictiveSignal[];
}

// Topic history for momentum analysis
const topicHistory: Record<number, Record<string, number>> = {};

// History retention in minutes
const HISTORY_RETENTION_MINUTES = 30;

// Time window for momentum comparison in minutes
const MOMENTUM_WINDOW_MINUTES = 10;

/**
 * Format topic ID to display name
 */
function formatTopicName(id: string): string {
	return id.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Analyze correlations across all news items
 */
export function analyzeCorrelations(allNews: NewsItem[]): CorrelationResults | null {
	if (!allNews || allNews.length === 0) return null;

	const now = Date.now();
	const currentTime = Math.floor(now / 60000); // Current minute

	const results: CorrelationResults = {
		emergingPatterns: [],
		momentumSignals: [],
		crossSourceCorrelations: [],
		predictiveSignals: []
	};

	// Count topics and track sources/headlines
	const topicCounts: Record<string, number> = {};
	const topicSources: Record<string, Set<string>> = {};
	const topicHeadlines: Record<string, Array<{ title: string; link: string; source: string }>> = {};

	// Analyze each news item
	for (const item of allNews) {
		const title = item.title || '';
		const source = item.source || 'Unknown';

		for (const topic of CORRELATION_TOPICS) {
			const matches = topic.patterns.some((p) => p.test(title));
			if (matches) {
				if (!topicCounts[topic.id]) {
					topicCounts[topic.id] = 0;
					topicSources[topic.id] = new Set();
					topicHeadlines[topic.id] = [];
				}
				topicCounts[topic.id]++;
				topicSources[topic.id].add(source);
				if (topicHeadlines[topic.id].length < 5) {
					topicHeadlines[topic.id].push({ title, link: item.link, source });
				}
			}
		}
	}

	// Update topic history for momentum tracking
	if (!topicHistory[currentTime]) {
		topicHistory[currentTime] = { ...topicCounts };

		// Clean old history entries
		for (const timeKey of Object.keys(topicHistory)) {
			if (currentTime - parseInt(timeKey) > HISTORY_RETENTION_MINUTES) {
				delete topicHistory[parseInt(timeKey)];
			}
		}
	}

	// Get old counts for momentum comparison
	const oldTime = currentTime - MOMENTUM_WINDOW_MINUTES;
	const oldCounts = topicHistory[oldTime] || {};

	// Process each topic
	for (const topic of CORRELATION_TOPICS) {
		const count = topicCounts[topic.id] || 0;
		const sources = topicSources[topic.id] ? Array.from(topicSources[topic.id]) : [];
		const headlines = topicHeadlines[topic.id] || [];
		const oldCount = oldCounts[topic.id] || 0;
		const delta = count - oldCount;

		// Emerging Patterns (3+ mentions)
		if (count >= 3) {
			const level: EmergingPattern['level'] =
				count >= 8 ? 'high' : count >= 5 ? 'elevated' : 'emerging';

			results.emergingPatterns.push({
				id: topic.id,
				name: formatTopicName(topic.id),
				category: topic.category,
				count,
				level,
				sources,
				headlines
			});
		}

		// Momentum Signals (rising topics)
		if (delta >= 2 || (count >= 3 && delta >= 1)) {
			const momentum: MomentumSignal['momentum'] =
				delta >= 4 ? 'surging' : delta >= 2 ? 'rising' : 'stable';

			results.momentumSignals.push({
				id: topic.id,
				name: formatTopicName(topic.id),
				category: topic.category,
				current: count,
				delta,
				momentum,
				headlines
			});
		}

		// Cross-Source Correlations (3+ sources)
		if (sources.length >= 3) {
			const level: CrossSourceCorrelation['level'] =
				sources.length >= 5 ? 'high' : sources.length >= 4 ? 'elevated' : 'emerging';

			results.crossSourceCorrelations.push({
				id: topic.id,
				name: formatTopicName(topic.id),
				category: topic.category,
				sourceCount: sources.length,
				sources,
				level,
				headlines
			});
		}

		// Predictive Signals (based on combined score)
		const score = count * 2 + sources.length * 3 + delta * 5;

		if (score >= 15) {
			const confidence = Math.min(95, Math.round(score * 1.5));
			const prediction = getPrediction(topic, count);
			const level: PredictiveSignal['level'] =
				confidence >= 70 ? 'high' : confidence >= 50 ? 'medium' : 'low';

			results.predictiveSignals.push({
				id: topic.id,
				name: formatTopicName(topic.id),
				category: topic.category,
				score,
				confidence,
				prediction,
				level,
				headlines
			});
		}
	}

	// Sort results
	results.emergingPatterns.sort((a, b) => b.count - a.count);
	results.momentumSignals.sort((a, b) => b.delta - a.delta);
	results.crossSourceCorrelations.sort((a, b) => b.sourceCount - a.sourceCount);
	results.predictiveSignals.sort((a, b) => b.score - a.score);

	return results;
}

/**
 * Generate prediction text based on topic and count
 */
function getPrediction(topic: CorrelationTopic, count: number): string {
	if (topic.id === 'tariffs' && count >= 4) {
		return 'Market volatility likely in next 24-48h';
	}
	if (topic.id === 'fed-rates') {
		return 'Expect increased financial sector coverage';
	}
	if (topic.id.includes('china') || topic.id.includes('russia')) {
		return 'Geopolitical escalation narrative forming';
	}
	if (topic.id === 'layoffs') {
		return 'Employment concerns may dominate news cycle';
	}
	if (topic.category === 'Conflict') {
		return 'Breaking developments likely within hours';
	}
	return 'Topic gaining mainstream traction';
}

/**
 * Get correlation summary for status display
 */
export function getCorrelationSummary(results: CorrelationResults | null): {
	totalSignals: number;
	status: string;
} {
	if (!results) {
		return { totalSignals: 0, status: 'NO DATA' };
	}

	const totalSignals =
		results.emergingPatterns.length +
		results.momentumSignals.length +
		results.predictiveSignals.length;

	return {
		totalSignals,
		status: totalSignals > 0 ? `${totalSignals} SIGNALS` : 'MONITORING'
	};
}

/**
 * Clear topic history (for testing or reset)
 */
export function clearCorrelationHistory(): void {
	for (const key of Object.keys(topicHistory)) {
		delete topicHistory[parseInt(key)];
	}
}
