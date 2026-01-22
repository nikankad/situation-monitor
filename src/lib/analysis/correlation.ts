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
			const prediction = generateDynamicPrediction(topic, count, sources.length, delta);
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
 * Generate dynamic prediction text based on actual data patterns
 * Analyzes mention count, source diversity, and momentum to create intelligent predictions
 */
function generateDynamicPrediction(
	topic: CorrelationTopic,
	count: number,
	sourceCount: number,
	delta: number
): string {
	const mentionLevel = count >= 10 ? 'explosive' : count >= 7 ? 'rapid' : count >= 4 ? 'growing' : 'emerging';
	const sourceLevel =
		sourceCount >= 6 ? 'widespread' : sourceCount >= 4 ? 'broad' : sourceCount >= 2 ? 'multi-source' : 'focused';
	const momentumLevel = delta >= 5 ? 'accelerating' : delta >= 3 ? 'building' : delta >= 1 ? 'increasing' : 'stable';

	// Category-based prediction templates
	if (topic.category === 'Conflict') {
		if (delta >= 4 && sourceCount >= 4) {
			return `${mentionLevel.charAt(0).toUpperCase() + mentionLevel.slice(1)} escalation with ${sourceLevel} coverage - expect major developments`;
		}
		if (count >= 8) {
			return 'Conflict narrative spreading rapidly across sources';
		}
		return 'Geopolitical tension building with increased reporting';
	}

	if (topic.category === 'Economic') {
		if (count >= 8 && sourceCount >= 5) {
			return `${mentionLevel} economic impact being reported by ${sourceCount}+ sources`;
		}
		if (delta >= 4) {
			return `${momentumLevel.charAt(0).toUpperCase() + momentumLevel.slice(1)} economic concern with ${mentionLevel} media attention`;
		}
		return `${sourceLevel} economic coverage with ${mentionLevel} trend`;
	}

	if (topic.category === 'Technology') {
		if (delta >= 5) {
			return `Tech story ${mentionLevel} with ${sourceLevel} adoption in news cycle`;
		}
		if (sourceCount >= 6) {
			return `Major tech narrative forming - ${sourceCount} independent sources covering`;
		}
		return `${mentionLevel} technology trend with ${sourceLevel} coverage`;
	}

	if (topic.category === 'Policy') {
		if (count >= 10) {
			return `Policy development dominating conversation across ${sourceCount} major sources`;
		}
		if (delta >= 4) {
			return `${momentumLevel.charAt(0).toUpperCase() + momentumLevel.slice(1)} policy impact with ${mentionLevel} reporting`;
		}
		return `Policy narrative ${mentionLevel} with focus from ${sourceCount} distinct sources`;
	}

	// Generic predictions based on data patterns
	if (delta >= 5 && sourceCount >= 5) {
		return `${mentionLevel} story ${momentumLevel} across ${sourceLevel} sources`;
	}

	if (count >= 10 && sourceCount >= 6) {
		return `Major narrative with ${count} mentions from ${sourceCount} independent sources`;
	}

	if (delta >= 4) {
		return `Rapidly ${momentumLevel} topic gaining attention across media`;
	}

	if (sourceCount >= 5) {
		return `${sourceLevel} consensus forming around this topic`;
	}

	if (count >= 8) {
		return `${mentionLevel} topic with sustained media coverage`;
	}

	return `${mentionLevel} pattern forming with ${sourceLevel} coverage`;
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
