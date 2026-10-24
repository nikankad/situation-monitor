/**
 * Formatting shared by the terminal views
 */

import { classifyScore } from '$lib/analysis/sentiment';

/** CSS class for a signed change; null (no value) reads as dim */
export function changeClass(value: number | null): string {
	if (value === null) return 't-dim';
	if (value > 0) return 't-up';
	if (value < 0) return 't-down';
	return '';
}

/** Tone is a keyword score from -100 to 100; null means no headlines */
export function formatTone(tone: number | null): string {
	return tone === null ? '—' : String(tone).replace('-', '−');
}

export function toneClass(tone: number | null): string {
	if (tone === null) return '';
	const sentiment = classifyScore(tone / 100);
	if (sentiment === 'positive') return 't-up';
	return sentiment === 'neutral' ? '' : 't-down';
}

export function toneLabel(tone: number | null): string {
	if (tone === null) return 'No data';
	const sentiment = classifyScore(tone / 100);
	return sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
}

/** Recent pace against the earlier pace, for example "3.0×"; a dash when quiet */
export function formatMomentum(momentum: number): string {
	return momentum > 0 ? `${momentum.toFixed(1)}×` : '—';
}

export function threatStyle(color: string): string {
	return `color: ${color}; border-color: ${color}`;
}
