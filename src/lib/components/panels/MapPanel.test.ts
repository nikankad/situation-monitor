import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import type { GdeltConflictEvent } from '$lib/api/gdelt-conflicts';

const conflict = (
	region: string,
	severity: GdeltConflictEvent['severity'],
	type: GdeltConflictEvent['type'],
	lat: number,
	lon: number
): GdeltConflictEvent => ({
	id: `gdelt-${region}`,
	name: region,
	description: 'desc',
	lat,
	lon,
	type,
	severity,
	status: 'active',
	eventCode: '19',
	eventCodeDescription: 'x',
	goldsteinScale: -5,
	avgTone: -3,
	numArticles: 30,
	numMentions: 30,
	country: region,
	countryCode: region,
	sourceUrl: '',
	timestamp: Date.now(),
	dateAdded: new Date().toISOString(),
	articles: []
});

vi.mock('$lib/api/gdelt-conflicts', () => ({
	fetchConflictEventsFromGDELT: vi.fn(async () => [
		conflict('Ukraine', 'critical', 'conflict', 49, 31),
		conflict('Taiwan', 'elevated', 'tension', 23.7, 121),
		conflict('Chad', 'low', 'development', 15, 19)
	])
}));

// One square "country" is enough to exercise the projection and the marker layers
const WORLD = {
	type: 'Topology',
	objects: {
		countries: {
			type: 'GeometryCollection',
			geometries: [{ type: 'Polygon', id: '840', arcs: [[0]] }]
		}
	},
	arcs: [
		[
			[0, 0],
			[10, 0],
			[0, 10],
			[-10, 0],
			[0, -10]
		]
	]
};

async function settle(): Promise<void> {
	for (let i = 0; i < 20; i++) {
		await new Promise((resolve) => setTimeout(resolve, 10));
		flushSync();
	}
}

describe('MapPanel', () => {
	let target: HTMLElement;
	let component: ReturnType<typeof mount>;

	beforeEach(async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(JSON.stringify(WORLD), { status: 200 }))
		);
		target = document.createElement('div');
		document.body.appendChild(target);
		const { default: MapPanel } = await import('./MapPanel.svelte');
		component = mount(MapPanel, { target, props: { monitors: [], news: [] } });
		await settle();
	});

	afterEach(() => {
		unmount(component);
		target.remove();
		vi.unstubAllGlobals();
	});

	it('draws a glyph-bearing badge for every marker type', () => {
		const count = (selector: string) => target.querySelectorAll(selector).length;

		// Zoomed out: hotspots limited to critical/high, and markers that would overlap a
		// more important one (e.g. Kyiv under the Ukraine conflict badge) are held back
		expect(count('.hotspot-marker')).toBe(3);
		expect(count('.infra-marker')).toBe(11);
		// Low-severity conflict regions are hidden at the default zoom
		expect(count('.conflict-marker')).toBe(2);

		for (const marker of target.querySelectorAll('.map-icon')) {
			expect(marker.querySelector('.marker-badge')).not.toBeNull();
			expect(marker.querySelectorAll('.marker-glyph > *').length).toBeGreaterThan(0);
		}
	});

	it('never stacks markers on top of each other', () => {
		const points = [...target.querySelectorAll('.map-icon')].map((group) => {
			const match = group.getAttribute('transform')!.match(/translate\(([-\d.]+),([-\d.]+)\)/)!;
			return { x: Number(match[1]), y: Number(match[2]) };
		});
		expect(points.length).toBeGreaterThan(0);
		for (let i = 0; i < points.length; i++) {
			for (let j = i + 1; j < points.length; j++) {
				// Smallest badge radius is 6.5 and the map is drawn at zoom 1, so units are pixels
				expect(
					Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)
				).toBeGreaterThanOrEqual(13);
			}
		}
	});

	it('uses icons instead of emoji in the legend and controls', () => {
		const labels = [...target.querySelectorAll('.legend-btn')].map((b) => b.textContent?.trim());
		expect(labels).toEqual(['Conflicts', 'Hotspots', 'Strategic', 'News']);
		expect(target.querySelectorAll('.zoom-btn svg').length).toBe(3);
		// Icon children must be created in the SVG namespace or they render blank
		expect(target.querySelector('.zoom-btn svg > *')?.namespaceURI).toBe(
			'http://www.w3.org/2000/svg'
		);
		expect(target.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
	});

	it('shows a descriptive tooltip for strategic sites', () => {
		const hit = target.querySelector('.infra-marker .marker-hit') as SVGCircleElement;
		hit.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
		flushSync();
		const tooltip = target.querySelector('.map-tooltip');
		expect(tooltip?.textContent).toMatch(/chokepoint|cable|Nuclear|Military/);
		expect(tooltip?.textContent).not.toContain('undefined');
	});

	it('toggles a layer off and back on', () => {
		const infra = [...target.querySelectorAll<HTMLButtonElement>('.legend-btn')].find((b) =>
			b.textContent?.includes('Strategic')
		)!;
		infra.click();
		flushSync();
		expect(target.querySelectorAll('.infra-marker').length).toBe(0);
		expect(infra.getAttribute('aria-pressed')).toBe('false');
		infra.click();
		flushSync();
		expect(target.querySelectorAll('.infra-marker').length).toBe(11);
	});
});
