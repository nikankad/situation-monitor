/**
 * Tests for geo helpers
 */

import { describe, it, expect } from 'vitest';
import { haversineKm, nearbySites, highestThreat } from './geo';

describe('haversineKm', () => {
	it('measures a known distance', () => {
		// London to Paris is about 344 km
		expect(haversineKm(51.5, -0.12, 48.85, 2.35)).toBeGreaterThan(335);
		expect(haversineKm(51.5, -0.12, 48.85, 2.35)).toBeLessThan(350);
	});

	it('is zero for the same point', () => {
		expect(haversineKm(10, 20, 10, 20)).toBe(0);
	});
});

describe('nearbySites', () => {
	it('finds sites near Tehran, nearest first, with distances', () => {
		const sites = nearbySites(35.7, 51.4, 700);
		expect(sites.length).toBeGreaterThan(0);
		expect(sites[0].name).toBe('Tehran');
		expect(sites[0].distanceKm).toBeLessThan(5);
		expect(sites.some((s) => s.kind === 'nuclear' && s.name === 'Natanz')).toBe(true);
		for (let i = 1; i < sites.length; i++) {
			expect(sites[i].distanceKm).toBeGreaterThanOrEqual(sites[i - 1].distanceKm);
		}
	});

	it('finds nothing in the middle of an ocean', () => {
		expect(nearbySites(-50, -120, 300)).toEqual([]);
	});
});

describe('highestThreat', () => {
	it('returns the most severe hotspot level', () => {
		expect(highestThreat(nearbySites(35.7, 51.4, 700))).toBe('critical');
	});

	it('returns null without hotspots', () => {
		expect(highestThreat([])).toBeNull();
	});
});
