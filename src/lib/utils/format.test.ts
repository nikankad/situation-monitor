/**
 * Tests for formatting utilities
 */

import { describe, it, expect } from 'vitest';
import { formatAgo, formatPrice } from './format';

describe('formatPrice', () => {
	it('uses two decimals under 100 and none above', () => {
		expect(formatPrice(81.2)).toBe('81.20');
		expect(formatPrice(2412.5)).toBe('2,412.5');
		expect(formatPrice(64210)).toBe('64,210');
	});
});

describe('formatAgo', () => {
	it('phrases a past time for a sentence', () => {
		expect(formatAgo(Date.now() - 5 * 60 * 1000)).toBe('5m ago');
		expect(formatAgo(Date.now() - 3 * 60 * 60 * 1000)).toBe('3h ago');
		expect(formatAgo(Date.now())).toBe('just now');
	});
});
