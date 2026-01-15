/**
 * Tests for monitors store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// Mock $app/environment before importing the store
vi.mock('$app/environment', () => ({
	browser: true
}));

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		})
	};
})();

Object.defineProperty(globalThis, 'localStorage', {
	value: localStorageMock
});

describe('Monitors Store', () => {
	beforeEach(async () => {
		localStorageMock.clear();
		vi.clearAllMocks();
		vi.resetModules();
	});

	it('should start with empty monitors', async () => {
		const { monitors } = await import('./monitors');

		const state = get(monitors);
		expect(state.monitors).toEqual([]);
		expect(state.matches).toEqual([]);
	});

	it('should add a new monitor', async () => {
		const { monitors } = await import('./monitors');

		const newMonitor = monitors.addMonitor({
			name: 'Test Monitor',
			keywords: ['test', 'keyword'],
			enabled: true
		});

		expect(newMonitor).not.toBeNull();
		expect(newMonitor?.name).toBe('Test Monitor');
		expect(newMonitor?.keywords).toEqual(['test', 'keyword']);
		expect(newMonitor?.id).toMatch(/^mon_/);
	});

	it('should update a monitor', async () => {
		const { monitors } = await import('./monitors');

		const monitor = monitors.addMonitor({
			name: 'Original',
			keywords: ['original'],
			enabled: true
		});

		const updated = monitors.updateMonitor(monitor!.id, {
			name: 'Updated',
			keywords: ['updated', 'new']
		});

		expect(updated).toBe(true);

		const found = monitors.getMonitor(monitor!.id);
		expect(found?.name).toBe('Updated');
		expect(found?.keywords).toEqual(['updated', 'new']);
	});

	it('should delete a monitor', async () => {
		const { monitors } = await import('./monitors');

		const monitor = monitors.addMonitor({
			name: 'To Delete',
			keywords: ['delete'],
			enabled: true
		});

		const deleted = monitors.deleteMonitor(monitor!.id);
		expect(deleted).toBe(true);

		const found = monitors.getMonitor(monitor!.id);
		expect(found).toBeUndefined();
	});

	it('should toggle monitor enabled state', async () => {
		const { monitors } = await import('./monitors');

		const monitor = monitors.addMonitor({
			name: 'Toggle Test',
			keywords: ['toggle'],
			enabled: true
		});

		monitors.toggleMonitor(monitor!.id);
		expect(monitors.getMonitor(monitor!.id)?.enabled).toBe(false);

		monitors.toggleMonitor(monitor!.id);
		expect(monitors.getMonitor(monitor!.id)?.enabled).toBe(true);
	});

	it('should scan for matches', async () => {
		const { monitors } = await import('./monitors');

		monitors.addMonitor({
			name: 'Ukraine Monitor',
			keywords: ['ukraine', 'zelensky'],
			enabled: true
		});

		const newsItems = [
			{
				id: '1',
				title: 'Ukraine announces new policy',
				source: 'BBC',
				link: 'https://bbc.com/1',
				timestamp: Date.now(),
				category: 'politics' as const
			},
			{
				id: '2',
				title: 'Tech stocks rise',
				source: 'CNBC',
				link: 'https://cnbc.com/2',
				timestamp: Date.now(),
				category: 'finance' as const
			}
		];

		const matches = monitors.scanForMatches(newsItems);

		expect(matches.length).toBe(1);
		expect(matches[0].item.title).toContain('Ukraine');
		expect(matches[0].matchedKeywords).toContain('ukraine');
	});

	it('should not match disabled monitors', async () => {
		const { monitors } = await import('./monitors');

		monitors.addMonitor({
			name: 'Disabled Monitor',
			keywords: ['test'],
			enabled: false
		});

		const newsItems = [
			{
				id: '1',
				title: 'Test headline',
				source: 'Test',
				link: 'https://test.com',
				timestamp: Date.now(),
				category: 'politics' as const
			}
		];

		const matches = monitors.scanForMatches(newsItems);
		expect(matches.length).toBe(0);
	});

	it('should persist monitors to localStorage', async () => {
		const { monitors } = await import('./monitors');

		monitors.addMonitor({
			name: 'Persistent Monitor',
			keywords: ['persist'],
			enabled: true
		});

		expect(localStorageMock.setItem).toHaveBeenCalledWith('customMonitors', expect.any(String));
	});

	it('should derive enabled monitors correctly', async () => {
		const { monitors, enabledMonitors, monitorCount } = await import('./monitors');

		monitors.addMonitor({ name: 'Enabled', keywords: ['a'], enabled: true });
		monitors.addMonitor({ name: 'Disabled', keywords: ['b'], enabled: false });
		monitors.addMonitor({ name: 'Also Enabled', keywords: ['c'], enabled: true });

		expect(get(enabledMonitors).length).toBe(2);
		expect(get(monitorCount)).toBe(3);
	});
});
