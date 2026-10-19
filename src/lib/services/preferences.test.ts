import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import {
	initializePreferences,
	preferenceStorage,
	preferenceSync,
	flushPreferences
} from './preferences';

beforeEach(() => {
	initializePreferences({});
	vi.restoreAllMocks();
});

describe('account preference synchronization', () => {
	it('initializes only the current account without reading browser storage', () => {
		initializePreferences({ panelOrder: ['map'] });
		expect(preferenceStorage.getItem('panelOrder')).toBe('["map"]');
		initializePreferences({});
		expect(preferenceStorage.getItem('panelOrder')).toBeNull();
	});
	it('retains failed saves and retries the latest value', async () => {
		const request = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValueOnce(new Response('', { status: 500 }))
			.mockResolvedValue(new Response('{}'));
		preferenceStorage.setItem('panelOrder', '["map"]');
		expect(await flushPreferences()).toBe(false);
		expect(get(preferenceSync)).toBe('error');
		preferenceStorage.setItem('panelOrder', '["markets"]');
		expect(await flushPreferences()).toBe(true);
		expect(JSON.parse(String(request.mock.calls[1][1]?.body))).toEqual({ panelOrder: ['markets'] });
		expect(get(preferenceSync)).toBe('saved');
	});
	it('serializes changes made while an earlier save is in flight', async () => {
		let resolve!: (response: Response) => void;
		const request = vi
			.spyOn(globalThis, 'fetch')
			.mockReturnValueOnce(
				new Promise((done) => {
					resolve = done;
				})
			)
			.mockResolvedValue(new Response('{}'));
		preferenceStorage.setItem('panelOrder', '["map"]');
		const saving = flushPreferences();
		preferenceStorage.setItem('panelOrder', '["markets"]');
		resolve(new Response('{}'));
		expect(await saving).toBe(true);
		expect(request).toHaveBeenCalledTimes(2);
		expect(JSON.parse(String(request.mock.calls[1][1]?.body))).toEqual({ panelOrder: ['markets'] });
	});
});
