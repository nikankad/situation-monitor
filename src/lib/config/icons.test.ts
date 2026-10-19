import { describe, it, expect } from 'vitest';
import { getIconNodes, iconSvg, type IconName } from './icons';
import { WEATHER_CODES } from './map';

const SHAPES = new Set(['path', 'circle', 'line', 'rect', 'polyline', 'polygon', 'ellipse']);

describe('icons', () => {
	it('renders an SVG string made only of registry geometry', () => {
		const svg = iconSvg('triangle-alert', { size: 20, color: '#ff0000' });
		expect(svg).toContain('viewBox="0 0 24 24"');
		expect(svg).toContain('width="20"');
		expect(svg).toContain('stroke="#ff0000"');
		expect(svg).toContain('<path');
	});

	it('only uses basic SVG shapes', () => {
		const names: IconName[] = [
			'swords',
			'siren',
			'radar',
			'anchor',
			'shield',
			'cable',
			'radiation'
		];
		for (const name of names) {
			const nodes = getIconNodes(name);
			expect(nodes.length).toBeGreaterThan(0);
			for (const [tag] of nodes) expect(SHAPES.has(tag)).toBe(true);
		}
	});

	it('has an icon for every weather condition', () => {
		for (const condition of Object.values(WEATHER_CODES)) {
			expect(getIconNodes(condition.icon).length).toBeGreaterThan(0);
		}
	});
});
