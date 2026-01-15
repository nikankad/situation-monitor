/**
 * Tests for main character analysis
 */

import { describe, it, expect } from 'vitest';
import {
	calculateMainCharacter,
	getMainCharacterSummary,
	calculateDominance
} from './main-character';
import type { NewsItem } from '$lib/types';

describe('Main Character Analysis', () => {
	it('should return empty results for empty news', () => {
		const results = calculateMainCharacter([]);
		expect(results.characters).toEqual([]);
		expect(results.topCharacter).toBeNull();
	});

	it('should count mentions correctly', () => {
		const news: NewsItem[] = [
			{
				id: '1',
				title: 'Trump announces policy',
				source: 'BBC',
				link: 'a',
				timestamp: Date.now(),
				category: 'politics'
			},
			{
				id: '2',
				title: 'Trump speaks at rally',
				source: 'CNN',
				link: 'b',
				timestamp: Date.now(),
				category: 'politics'
			},
			{
				id: '3',
				title: 'Biden meets with leaders',
				source: 'NYT',
				link: 'c',
				timestamp: Date.now(),
				category: 'politics'
			}
		];

		const results = calculateMainCharacter(news);

		expect(results.characters.length).toBeGreaterThan(0);
		expect(results.topCharacter?.name).toBe('Trump');
		expect(results.topCharacter?.count).toBe(2);
	});

	it('should rank characters by mention count', () => {
		const news: NewsItem[] = [
			{
				id: '1',
				title: 'Musk buys company',
				source: 'A',
				link: 'a',
				timestamp: Date.now(),
				category: 'tech'
			},
			{
				id: '2',
				title: 'Elon announces feature',
				source: 'B',
				link: 'b',
				timestamp: Date.now(),
				category: 'tech'
			},
			{
				id: '3',
				title: 'Musk tweets again',
				source: 'C',
				link: 'c',
				timestamp: Date.now(),
				category: 'tech'
			},
			{
				id: '4',
				title: 'Trump rally today',
				source: 'D',
				link: 'd',
				timestamp: Date.now(),
				category: 'politics'
			}
		];

		const results = calculateMainCharacter(news);

		expect(results.characters[0].name).toBe('Elon Musk');
		expect(results.characters[0].count).toBe(3);
		expect(results.characters[0].rank).toBe(1);
	});

	it('should limit results to top 10', () => {
		// Create news mentioning many different people
		const names = [
			'Trump',
			'Biden',
			'Musk',
			'Putin',
			'Zelensky',
			'Xi',
			'Netanyahu',
			'Sam Altman',
			'Zuckerberg',
			'Bezos',
			'Tim Cook',
			'Powell'
		];

		const news: NewsItem[] = names.map((name, i) => ({
			id: String(i),
			title: `${name} in the news`,
			source: 'Source',
			link: `link${i}`,
			timestamp: Date.now(),
			category: 'politics' as const
		}));

		const results = calculateMainCharacter(news);

		expect(results.characters.length).toBeLessThanOrEqual(10);
	});

	it('should match multiple patterns for same person', () => {
		const news: NewsItem[] = [
			{
				id: '1',
				title: 'Elon Musk announces',
				source: 'A',
				link: 'a',
				timestamp: Date.now(),
				category: 'tech'
			},
			{
				id: '2',
				title: 'Musk speaks out',
				source: 'B',
				link: 'b',
				timestamp: Date.now(),
				category: 'tech'
			}
		];

		const results = calculateMainCharacter(news);

		// "Elon Musk" matches both "elon" and "musk" patterns, plus "Musk" matches "musk"
		// So total count is 3 (2 from first headline + 1 from second)
		expect(results.topCharacter?.name).toBe('Elon Musk');
		expect(results.topCharacter?.count).toBe(3);
	});

	it('should return correct summary', () => {
		const emptyResults = calculateMainCharacter([]);
		expect(getMainCharacterSummary(emptyResults)).toEqual({
			name: '',
			count: 0,
			status: 'NO DATA'
		});

		const news: NewsItem[] = [
			{
				id: '1',
				title: 'Putin addresses nation',
				source: 'A',
				link: 'a',
				timestamp: Date.now(),
				category: 'politics'
			},
			{
				id: '2',
				title: 'Putin speaks on economy',
				source: 'B',
				link: 'b',
				timestamp: Date.now(),
				category: 'politics'
			}
		];

		const results = calculateMainCharacter(news);
		const summary = getMainCharacterSummary(results);

		expect(summary.name).toBe('Putin');
		expect(summary.count).toBe(2);
		expect(summary.status).toContain('Putin');
		expect(summary.status).toContain('2 mentions');
	});

	it('should calculate dominance correctly', () => {
		// Single character = 100% dominance
		const singleNews: NewsItem[] = [
			{
				id: '1',
				title: 'Trump news',
				source: 'A',
				link: 'a',
				timestamp: Date.now(),
				category: 'politics'
			}
		];
		expect(calculateDominance(calculateMainCharacter(singleNews))).toBe(100);

		// Empty returns 100 (no competition = full dominance, edge case)
		expect(calculateDominance(calculateMainCharacter([]))).toBe(100);

		// Two characters with same count = 0% dominance
		const evenNews: NewsItem[] = [
			{
				id: '1',
				title: 'Trump speaks',
				source: 'A',
				link: 'a',
				timestamp: Date.now(),
				category: 'politics'
			},
			{
				id: '2',
				title: 'Biden responds',
				source: 'B',
				link: 'b',
				timestamp: Date.now(),
				category: 'politics'
			}
		];
		expect(calculateDominance(calculateMainCharacter(evenNews))).toBe(0);

		// Clear leader = high dominance (capped at 100)
		const dominantNews: NewsItem[] = [
			{
				id: '1',
				title: 'Musk announcement',
				source: 'A',
				link: 'a',
				timestamp: Date.now(),
				category: 'tech'
			},
			{
				id: '2',
				title: 'Elon tweets',
				source: 'B',
				link: 'b',
				timestamp: Date.now(),
				category: 'tech'
			},
			{
				id: '3',
				title: 'Musk company news',
				source: 'C',
				link: 'c',
				timestamp: Date.now(),
				category: 'tech'
			},
			{
				id: '4',
				title: 'Trump rally',
				source: 'D',
				link: 'd',
				timestamp: Date.now(),
				category: 'politics'
			}
		];
		const dominance = calculateDominance(calculateMainCharacter(dominantNews));
		expect(dominance).toBe(100); // Dominance is capped at 100
	});

	it('should handle case insensitivity', () => {
		const news: NewsItem[] = [
			{
				id: '1',
				title: 'TRUMP announces policy',
				source: 'A',
				link: 'a',
				timestamp: Date.now(),
				category: 'politics'
			},
			{
				id: '2',
				title: 'trump speaks today',
				source: 'B',
				link: 'b',
				timestamp: Date.now(),
				category: 'politics'
			}
		];

		const results = calculateMainCharacter(news);
		expect(results.topCharacter?.name).toBe('Trump');
		expect(results.topCharacter?.count).toBe(2);
	});
});
