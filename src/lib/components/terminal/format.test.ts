/**
 * Tests for terminal formatting helpers
 */

import { describe, it, expect } from 'vitest';
import { changeClass, formatMomentum, formatTone, toneClass, toneLabel } from './format';

describe('changeClass', () => {
	it('colours by sign and dims a missing value', () => {
		expect(changeClass(1.2)).toBe('t-up');
		expect(changeClass(-0.4)).toBe('t-down');
		expect(changeClass(0)).toBe('');
		expect(changeClass(null)).toBe('t-dim');
	});
});

describe('tone', () => {
	it('formats with a proper minus sign and a dash for no data', () => {
		expect(formatTone(-46)).toBe('−46');
		expect(formatTone(12)).toBe('12');
		expect(formatTone(null)).toBe('—');
	});

	it('labels and colours from the sentiment thresholds', () => {
		expect(toneLabel(-92)).toBe('Alarming');
		expect(toneLabel(-40)).toBe('Critical');
		expect(toneLabel(-20)).toBe('Negative');
		expect(toneLabel(0)).toBe('Neutral');
		expect(toneLabel(25)).toBe('Positive');
		expect(toneLabel(null)).toBe('No data');
		expect(toneClass(-20)).toBe('t-down');
		expect(toneClass(0)).toBe('');
		expect(toneClass(25)).toBe('t-up');
		expect(toneClass(null)).toBe('');
	});
});

describe('formatMomentum', () => {
	it('shows a multiple, or a dash when quiet', () => {
		expect(formatMomentum(3)).toBe('3.0×');
		expect(formatMomentum(0)).toBe('—');
	});
});
