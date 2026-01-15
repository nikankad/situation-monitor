/**
 * Tests for correlation engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { analyzeCorrelations, getCorrelationSummary, clearCorrelationHistory } from './correlation';
import type { NewsItem } from '$lib/types';

describe('Correlation Engine', () => {
	beforeEach(() => {
		clearCorrelationHistory();
	});

	it('should return null for empty news', () => {
		expect(analyzeCorrelations([])).toBeNull();
		expect(analyzeCorrelations(null as unknown as NewsItem[])).toBeNull();
	});

	it('should detect emerging patterns', () => {
		const news: NewsItem[] = [
			{
				id: '1',
				title: 'Ukraine announces new policy',
				source: 'BBC',
				link: 'a',
				timestamp: Date.now(),
				category: 'politics'
			},
			{
				id: '2',
				title: 'Ukraine military update',
				source: 'CNN',
				link: 'b',
				timestamp: Date.now(),
				category: 'politics'
			},
			{
				id: '3',
				title: 'Zelensky addresses nation',
				source: 'NYT',
				link: 'c',
				timestamp: Date.now(),
				category: 'politics'
			}
		];

		const results = analyzeCorrelations(news);

		expect(results).not.toBeNull();
		expect(results!.emergingPatterns.length).toBeGreaterThan(0);

		const ukrainePattern = results!.emergingPatterns.find((p) => p.id === 'russia-ukraine');
		expect(ukrainePattern).toBeDefined();
		expect(ukrainePattern!.count).toBeGreaterThanOrEqual(3);
		expect(ukrainePattern!.level).toBe('emerging');
	});

	it('should categorize pattern levels correctly', () => {
		// Create many Ukraine-related articles to trigger 'high' level
		const news: NewsItem[] = Array.from({ length: 10 }, (_, i) => ({
			id: String(i),
			title: `Ukraine news ${i}`,
			source: `Source${i}`,
			link: `link${i}`,
			timestamp: Date.now(),
			category: 'politics' as const
		}));

		const results = analyzeCorrelations(news);
		const ukrainePattern = results?.emergingPatterns.find((p) => p.id === 'russia-ukraine');

		expect(ukrainePattern?.level).toBe('high');
	});

	it('should track cross-source correlations', () => {
		const news: NewsItem[] = [
			{
				id: '1',
				title: 'Tariff news today',
				source: 'BBC',
				link: 'a',
				timestamp: Date.now(),
				category: 'finance'
			},
			{
				id: '2',
				title: 'Trade war escalates',
				source: 'CNN',
				link: 'b',
				timestamp: Date.now(),
				category: 'finance'
			},
			{
				id: '3',
				title: 'Import tax increases',
				source: 'NYT',
				link: 'c',
				timestamp: Date.now(),
				category: 'finance'
			},
			{
				id: '4',
				title: 'Customs duty update',
				source: 'WSJ',
				link: 'd',
				timestamp: Date.now(),
				category: 'finance'
			}
		];

		const results = analyzeCorrelations(news);
		const tariffCorrelation = results?.crossSourceCorrelations.find((c) => c.id === 'tariffs');

		expect(tariffCorrelation).toBeDefined();
		expect(tariffCorrelation!.sourceCount).toBe(4);
		expect(tariffCorrelation!.sources).toContain('BBC');
	});

	it('should generate predictive signals for high scores', () => {
		// Create many tariff articles to generate predictive signals
		const news: NewsItem[] = Array.from({ length: 8 }, (_, i) => ({
			id: String(i),
			title: `Tariff policy update ${i}`,
			source: `Source${i % 4}`,
			link: `link${i}`,
			timestamp: Date.now(),
			category: 'finance' as const
		}));

		const results = analyzeCorrelations(news);

		expect(results?.predictiveSignals.length).toBeGreaterThan(0);

		const tariffSignal = results?.predictiveSignals.find((s) => s.id === 'tariffs');
		if (tariffSignal) {
			expect(tariffSignal.prediction).toContain('volatility');
		}
	});

	it('should collect headlines for patterns', () => {
		const news: NewsItem[] = [
			{
				id: '1',
				title: 'Gaza conflict escalates',
				source: 'BBC',
				link: 'https://bbc.com/1',
				timestamp: Date.now(),
				category: 'politics'
			},
			{
				id: '2',
				title: 'Hamas negotiations',
				source: 'CNN',
				link: 'https://cnn.com/2',
				timestamp: Date.now(),
				category: 'politics'
			},
			{
				id: '3',
				title: 'Israel Gaza update',
				source: 'NYT',
				link: 'https://nyt.com/3',
				timestamp: Date.now(),
				category: 'politics'
			}
		];

		const results = analyzeCorrelations(news);
		const gazaPattern = results?.emergingPatterns.find((p) => p.id === 'israel-gaza');

		expect(gazaPattern?.headlines.length).toBeGreaterThan(0);
		expect(gazaPattern?.headlines[0].link).toBeDefined();
		expect(gazaPattern?.headlines[0].source).toBeDefined();
	});

	it('should return correct summary', () => {
		expect(getCorrelationSummary(null)).toEqual({ totalSignals: 0, status: 'NO DATA' });

		const news: NewsItem[] = [
			{
				id: '1',
				title: 'Ukraine update',
				source: 'BBC',
				link: 'a',
				timestamp: Date.now(),
				category: 'politics'
			},
			{
				id: '2',
				title: 'Ukraine news',
				source: 'CNN',
				link: 'b',
				timestamp: Date.now(),
				category: 'politics'
			},
			{
				id: '3',
				title: 'Zelensky speaks',
				source: 'NYT',
				link: 'c',
				timestamp: Date.now(),
				category: 'politics'
			}
		];

		const results = analyzeCorrelations(news);
		const summary = getCorrelationSummary(results);

		expect(summary.totalSignals).toBeGreaterThan(0);
		expect(summary.status).toMatch(/SIGNALS/);
	});
});
