/**
 * Tests for narrative tracker
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { analyzeNarratives, getNarrativeSummary, clearNarrativeHistory } from './narrative';
import type { NewsItem } from '$lib/types';

describe('Narrative Tracker', () => {
	beforeEach(() => {
		clearNarrativeHistory();
	});

	it('should return null for empty news', () => {
		expect(analyzeNarratives([])).toBeNull();
		expect(analyzeNarratives(null as unknown as NewsItem[])).toBeNull();
	});

	it('should detect narrative patterns', () => {
		const news: NewsItem[] = [
			{
				id: '1',
				title: 'Deep state allegations surface',
				source: 'Test',
				link: 'a',
				timestamp: Date.now(),
				category: 'politics'
			},
			{
				id: '2',
				title: 'Shadow government concerns',
				source: 'Test2',
				link: 'b',
				timestamp: Date.now(),
				category: 'politics'
			}
		];

		const results = analyzeNarratives(news);

		expect(results).not.toBeNull();
		const deepState =
			results!.emergingFringe.find((n) => n.id === 'deep-state') ||
			results!.narrativeWatch.find((n) => n.id === 'deep-state');

		expect(deepState).toBeDefined();
		expect(deepState!.count).toBe(2);
	});

	it('should classify disinfo patterns', () => {
		const news: NewsItem[] = [
			{
				id: '1',
				title: 'Depopulation agenda exposed',
				source: 'Fringe',
				link: 'a',
				timestamp: Date.now(),
				category: 'politics'
			}
		];

		const results = analyzeNarratives(news);

		expect(results!.disinfoSignals.length).toBeGreaterThan(0);
		expect(results!.disinfoSignals.find((n) => n.id === 'depopulation')).toBeDefined();
	});

	it('should detect fringe-to-mainstream crossover', () => {
		const news: NewsItem[] = [
			{
				id: '1',
				title: 'Lab leak theory gains traction',
				source: 'ZeroHedge',
				link: 'a',
				timestamp: Date.now(),
				category: 'politics'
			},
			{
				id: '2',
				title: 'Lab leak investigation continues',
				source: 'BBC News',
				link: 'b',
				timestamp: Date.now(),
				category: 'politics'
			},
			{
				id: '3',
				title: 'Bioweapon research concerns',
				source: 'CNN',
				link: 'c',
				timestamp: Date.now(),
				category: 'politics'
			}
		];

		const results = analyzeNarratives(news);

		// Should detect the bio-weapon narrative crossing from fringe to mainstream
		expect(results!.fringeToMainstream.length).toBeGreaterThan(0);
	});

	it('should classify source types correctly', () => {
		const news: NewsItem[] = [
			{
				id: '1',
				title: 'Dollar collapse imminent',
				source: 'ZeroHedge',
				link: 'a',
				timestamp: Date.now(),
				category: 'finance'
			},
			{
				id: '2',
				title: 'Dedollarization fears',
				source: 'Infowars',
				link: 'b',
				timestamp: Date.now(),
				category: 'finance'
			}
		];

		const results = analyzeNarratives(news);

		const dollarNarrative = results!.emergingFringe.find((n) => n.id === 'dollar-collapse');

		expect(dollarNarrative).toBeDefined();
		expect(dollarNarrative!.fringeCount).toBeGreaterThan(0);
	});

	it('should track keywords and headlines', () => {
		const news: NewsItem[] = [
			{
				id: '1',
				title: 'AI doom predictions increase',
				source: 'Tech',
				link: 'a',
				timestamp: Date.now(),
				category: 'tech'
			},
			{
				id: '2',
				title: 'AI extinction risk debated',
				source: 'Tech2',
				link: 'b',
				timestamp: Date.now(),
				category: 'tech'
			}
		];

		const results = analyzeNarratives(news);

		const aiDoom =
			results!.emergingFringe.find((n) => n.id === 'ai-doom') ||
			results!.narrativeWatch.find((n) => n.id === 'ai-doom');

		expect(aiDoom).toBeDefined();
		expect(aiDoom!.keywords).toContain('ai doom');
		expect(aiDoom!.headlines.length).toBeGreaterThan(0);
	});

	it('should return correct summary', () => {
		expect(getNarrativeSummary(null)).toEqual({ total: 0, status: 'NO DATA' });

		const news: NewsItem[] = [
			{
				id: '1',
				title: 'Great reset concerns',
				source: 'Test',
				link: 'a',
				timestamp: Date.now(),
				category: 'politics'
			}
		];

		const results = analyzeNarratives(news);
		const summary = getNarrativeSummary(results);

		expect(summary.total).toBeGreaterThan(0);
		expect(summary.status).toMatch(/ACTIVE/);
	});

	it('should limit sources to 5', () => {
		const news: NewsItem[] = Array.from({ length: 10 }, (_, i) => ({
			id: String(i),
			title: 'Deep state news',
			source: `Source${i}`,
			link: `link${i}`,
			timestamp: Date.now(),
			category: 'politics' as const
		}));

		const results = analyzeNarratives(news);

		const deepState =
			results!.emergingFringe.find((n) => n.id === 'deep-state') ||
			results!.narrativeWatch.find((n) => n.id === 'deep-state');

		expect(deepState!.sources.length).toBeLessThanOrEqual(5);
	});
});
