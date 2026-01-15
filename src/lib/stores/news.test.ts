/**
 * Tests for news store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// Mock $app/environment
vi.mock('$app/environment', () => ({
	browser: true
}));

describe('News Store', () => {
	beforeEach(async () => {
		vi.resetModules();
	});

	it('should start with empty categories', async () => {
		const { news } = await import('./news');

		const state = get(news);
		expect(state.categories.politics.items).toEqual([]);
		expect(state.categories.tech.items).toEqual([]);
		expect(state.categories.finance.items).toEqual([]);
	});

	it('should set items for a category', async () => {
		const { news, politicsNews } = await import('./news');

		const items = [
			{
				id: '1',
				title: 'Test headline',
				source: 'BBC',
				link: 'https://bbc.com/1',
				timestamp: Date.now(),
				category: 'politics' as const
			}
		];

		news.setItems('politics', items);

		const politics = get(politicsNews);
		expect(politics.items.length).toBe(1);
		expect(politics.items[0].title).toBe('Test headline');
		expect(politics.loading).toBe(false);
		expect(politics.lastUpdated).not.toBeNull();
	});

	it('should enrich items with alert detection', async () => {
		const { news } = await import('./news');

		const items = [
			{
				id: '1',
				title: 'Military strike in region',
				source: 'BBC',
				link: 'https://bbc.com/1',
				timestamp: Date.now(),
				category: 'politics' as const
			},
			{
				id: '2',
				title: 'New tech startup launches',
				source: 'TechCrunch',
				link: 'https://tc.com/2',
				timestamp: Date.now(),
				category: 'tech' as const
			}
		];

		news.setItems('politics', [items[0]]);
		news.setItems('tech', [items[1]]);

		const state = get(news);
		expect(state.categories.politics.items[0].isAlert).toBe(true);
		expect(state.categories.politics.items[0].alertKeyword).toBe('military');
		expect(state.categories.tech.items[0].isAlert).toBe(false);
	});

	it('should set loading state', async () => {
		const { news, politicsNews } = await import('./news');

		news.setLoading('politics', true);
		expect(get(politicsNews).loading).toBe(true);

		news.setLoading('politics', false);
		expect(get(politicsNews).loading).toBe(false);
	});

	it('should set error state', async () => {
		const { news, politicsNews, hasErrors } = await import('./news');

		news.setError('politics', 'Failed to fetch');

		const politics = get(politicsNews);
		expect(politics.error).toBe('Failed to fetch');
		expect(politics.loading).toBe(false);

		expect(get(hasErrors)).toBe(true);
	});

	it('should append items without duplicates', async () => {
		const { news, techNews } = await import('./news');

		const initial = [
			{
				id: '1',
				title: 'First item',
				source: 'TC',
				link: 'https://tc.com/1',
				timestamp: Date.now(),
				category: 'tech' as const
			}
		];

		const more = [
			{
				id: '1',
				title: 'First item',
				source: 'TC',
				link: 'https://tc.com/1',
				timestamp: Date.now(),
				category: 'tech' as const
			},
			{
				id: '2',
				title: 'Second item',
				source: 'TC',
				link: 'https://tc.com/2',
				timestamp: Date.now(),
				category: 'tech' as const
			}
		];

		news.setItems('tech', initial);
		news.appendItems('tech', more);

		const tech = get(techNews);
		expect(tech.items.length).toBe(2);
	});

	it('should get all items across categories', async () => {
		const { news } = await import('./news');

		news.setItems('politics', [
			{
				id: '1',
				title: 'Politics',
				source: 'A',
				link: 'a',
				timestamp: Date.now(),
				category: 'politics' as const
			}
		]);
		news.setItems('tech', [
			{
				id: '2',
				title: 'Tech',
				source: 'B',
				link: 'b',
				timestamp: Date.now(),
				category: 'tech' as const
			}
		]);

		const all = news.getAllItems();
		expect(all.length).toBe(2);
	});

	it('should derive alerts correctly', async () => {
		const { news, alerts } = await import('./news');

		news.setItems('politics', [
			{
				id: '1',
				title: 'War breaks out',
				source: 'BBC',
				link: 'a',
				timestamp: Date.now(),
				category: 'politics' as const
			},
			{
				id: '2',
				title: 'Normal news',
				source: 'BBC',
				link: 'b',
				timestamp: Date.now(),
				category: 'politics' as const
			}
		]);

		const alertItems = get(alerts);
		expect(alertItems.length).toBe(1);
		expect(alertItems[0].title).toBe('War breaks out');
	});

	it('should clear all categories', async () => {
		const { news } = await import('./news');

		news.setItems('politics', [
			{
				id: '1',
				title: 'Test',
				source: 'A',
				link: 'a',
				timestamp: Date.now(),
				category: 'politics' as const
			}
		]);

		news.clearAll();

		const state = get(news);
		expect(state.categories.politics.items).toEqual([]);
	});
});
