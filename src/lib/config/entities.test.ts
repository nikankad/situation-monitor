/**
 * Tests for the entity registry
 */

import { describe, it, expect } from 'vitest';
import { ENTITIES, entityKey, entityPath, getEntity, matchEntities } from './entities';

function matchedKeys(title: string): string[] {
	return matchEntities(title).map(entityKey);
}

describe('registry', () => {
	it('has a unique type and id for every entity', () => {
		const keys = ENTITIES.map(entityKey);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it('keeps same-named entities of different types apart', () => {
		const region = getEntity('region', 'iran');
		const topic = getEntity('topic', 'iran');
		expect(region).toBeDefined();
		expect(topic).toBeDefined();
		expect(region).not.toBe(topic);
		expect(entityPath(region!)).toBe('/e/region/iran');
		expect(entityPath(topic!)).toBe('/e/topic/iran');
	});

	it('uses URL-safe ids', () => {
		for (const entity of ENTITIES) {
			expect(entity.id).toMatch(/^[a-z0-9-]+$/);
		}
	});

	it('gives every region a map location and every asset a symbol', () => {
		for (const entity of ENTITIES) {
			if (entity.type === 'region') expect(entity.location).toBeDefined();
			if (entity.type === 'asset') expect(entity.symbol).toBeTruthy();
		}
	});

	it('describes every topic, narrative and asset', () => {
		for (const entity of ENTITIES) {
			if (['topic', 'narrative', 'asset'].includes(entity.type)) {
				expect(entity.summary, `${entity.type}/${entity.id}`).toBeTruthy();
			}
		}
	});

	it('uses acronyms in capitals in names', () => {
		expect(getEntity('narrative', 'wef-agenda')?.name).toBe('WEF Agenda');
		expect(getEntity('narrative', 'ai-doom')?.name).toBe('AI Doom');
	});

	it('returns undefined for an unknown entity', () => {
		expect(getEntity('region', 'atlantis')).toBeUndefined();
	});
});

describe('matching', () => {
	it('counts "US" in capitals but not the word "us"', () => {
		expect(matchedKeys('US stocks slide as traders wait')).toContain('region/usa');
		expect(matchedKeys('Analyst tells us what to expect')).not.toContain('region/usa');
	});

	it('does not count "South America" as the United States', () => {
		expect(matchedKeys('Floods hit South America')).not.toContain('region/usa');
		expect(matchedKeys('Floods hit South America')).toContain('region/south-america');
	});

	it('keeps North Korea out of South Korea', () => {
		const keys = matchedKeys('North Korean missile test alarms neighbours');
		expect(keys).not.toContain('region/south-korea');
	});

	it('gives the Persian Gulf to the strait rather than Iran', () => {
		const keys = matchedKeys('Tanker seized in the Persian Gulf');
		expect(keys).not.toContain('region/iran');
	});

	it('matches whole words only', () => {
		expect(matchedKeys('Business owners worry')).not.toContain('region/usa');
		expect(matchedKeys('Fed signals rate cut path')).toContain('topic/fed-rates');
	});

	it('gives the same answer every time it is called', () => {
		const title = 'Trump and Putin to hold talks';
		const first = matchedKeys(title);
		expect(first.length).toBeGreaterThan(0);
		for (let i = 0; i < 5; i++) expect(matchedKeys(title)).toEqual(first);
	});

	it('links assets to headlines that could explain a move', () => {
		expect(matchedKeys('Bitcoin hits a new record')).toContain('asset/btc');
		expect(matchedKeys('Crude oil jumps on supply fears')).toContain('asset/crude-oil');
	});

	it('returns the same matches when a title is looked up again', () => {
		const first = matchEntities('Iran missile test alarms neighbours');
		expect(matchEntities('Iran missile test alarms neighbours')).toBe(first);
	});

	it('returns nothing for empty text', () => {
		expect(matchEntities('')).toEqual([]);
	});
});
