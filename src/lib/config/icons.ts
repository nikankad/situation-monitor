/**
 * Icon registry. Geometry is taken from Lucide (https://lucide.dev, ISC license),
 * drawn on a 24x24 grid with a 2px round stroke.
 */

export type IconElement = [tag: string, attrs: Record<string, string | number>];

const ICON_NODES = {
	'triangle-alert': [
		['path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' }],
		['path', { d: 'M12 9v4' }],
		['path', { d: 'M12 17h.01' }]
	],
	swords: [
		['path', { d: 'm13 19 6-6' }],
		['path', { d: 'M14.5 17.5 3.586 6.586A2 2 0 013 5.172V3h2.172a2 2 0 011.414.586L17.5 14.5' }],
		[
			'path',
			{ d: 'm14.828 6.172 2.586-2.586A2 2 0 0118.828 3H21v2.172a2 2 0 01-.586 1.414l-2.586 2.586' }
		],
		['path', { d: 'm16 16 4 4' }],
		['path', { d: 'm19 21 2-2' }],
		['path', { d: 'm5 14 4 4' }],
		['path', { d: 'm5 21-2-2' }],
		['path', { d: 'M7.5 16.5 4 20' }]
	],
	siren: [
		['path', { d: 'M7 18v-6a5 5 0 1 1 10 0v6' }],
		['path', { d: 'M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z' }],
		['path', { d: 'M21 12h1' }],
		['path', { d: 'M18.5 4.5 18 5' }],
		['path', { d: 'M2 12h1' }],
		['path', { d: 'M12 2v1' }],
		['path', { d: 'm4.929 4.929.707.707' }],
		['path', { d: 'M12 12v6' }]
	],
	zap: [
		[
			'path',
			{
				d: 'M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z'
			}
		]
	],
	'map-pin': [
		[
			'path',
			{
				d: 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0'
			}
		],
		['circle', { cx: '12', cy: '10', r: '3' }]
	],
	newspaper: [
		['path', { d: 'M15 18h-5' }],
		['path', { d: 'M18 14h-8' }],
		[
			'path',
			{
				d: 'M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2'
			}
		],
		['rect', { width: '8', height: '4', x: '10', y: '6', rx: '1' }]
	],
	radar: [
		['path', { d: 'M19.07 4.93A10 10 0 0 0 6.99 3.34' }],
		['path', { d: 'M4 6h.01' }],
		['path', { d: 'M2.29 9.62A10 10 0 1 0 21.31 8.35' }],
		['path', { d: 'M16.24 7.76A6 6 0 1 0 8.23 16.67' }],
		['path', { d: 'M12 18h.01' }],
		['path', { d: 'M17.99 11.66A6 6 0 0 1 15.77 16.67' }],
		['circle', { cx: '12', cy: '12', r: '2' }],
		['path', { d: 'm13.41 10.59 5.66-5.66' }]
	],
	clock: [
		['circle', { cx: '12', cy: '12', r: '10' }],
		['path', { d: 'M12 6v6l4 2' }]
	],
	settings: [
		[
			'path',
			{
				d: 'M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915'
			}
		],
		['circle', { cx: '12', cy: '12', r: '3' }]
	],
	'chevron-down': [['path', { d: 'm6 9 6 6 6-6' }]],
	'chevron-up': [['path', { d: 'm18 15-6-6-6 6' }]],
	'arrow-up': [
		['path', { d: 'm5 12 7-7 7 7' }],
		['path', { d: 'M12 19V5' }]
	],
	'arrow-down': [
		['path', { d: 'M12 5v14' }],
		['path', { d: 'm19 12-7 7-7-7' }]
	],
	'arrow-right': [
		['path', { d: 'M5 12h14' }],
		['path', { d: 'm12 5 7 7-7 7' }]
	],
	'arrow-left-right': [
		['path', { d: 'M8 3 4 7l4 4' }],
		['path', { d: 'M4 7h16' }],
		['path', { d: 'm16 21 4-4-4-4' }],
		['path', { d: 'M20 17H4' }]
	],
	'external-link': [
		['path', { d: 'M15 3h6v6' }],
		['path', { d: 'M10 14 21 3' }],
		['path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }]
	],
	'rotate-ccw': [
		['path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' }],
		['path', { d: 'M3 3v5h5' }]
	],
	'refresh-cw': [
		['path', { d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' }],
		['path', { d: 'M21 3v5h-5' }],
		['path', { d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' }],
		['path', { d: 'M8 16H3v5' }]
	],
	'circle-alert': [
		['circle', { cx: '12', cy: '12', r: '10' }],
		['line', { x1: '12', x2: '12', y1: '8', y2: '12' }],
		['line', { x1: '12', x2: '12.01', y1: '16', y2: '16' }]
	],
	x: [
		['path', { d: 'M18 6 6 18' }],
		['path', { d: 'm6 6 12 12' }]
	],
	plus: [
		['path', { d: 'M5 12h14' }],
		['path', { d: 'M12 5v14' }]
	],
	minus: [['path', { d: 'M5 12h14' }]],
	sun: [
		['circle', { cx: '12', cy: '12', r: '4' }],
		['path', { d: 'M12 2v2' }],
		['path', { d: 'M12 20v2' }],
		['path', { d: 'm4.93 4.93 1.41 1.41' }],
		['path', { d: 'm17.66 17.66 1.41 1.41' }],
		['path', { d: 'M2 12h2' }],
		['path', { d: 'M20 12h2' }],
		['path', { d: 'm6.34 17.66-1.41 1.41' }],
		['path', { d: 'm19.07 4.93-1.41 1.41' }]
	],
	'cloud-sun': [
		['path', { d: 'M12 2v2' }],
		['path', { d: 'm4.93 4.93 1.41 1.41' }],
		['path', { d: 'M20 12h2' }],
		['path', { d: 'm19.07 4.93-1.41 1.41' }],
		['path', { d: 'M15.947 12.65a4 4 0 0 0-5.925-4.128' }],
		['path', { d: 'M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z' }]
	],
	cloud: [['path', { d: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z' }]],
	'cloud-fog': [
		['path', { d: 'M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242' }],
		['path', { d: 'M16 17H7' }],
		['path', { d: 'M17 21H9' }]
	],
	'cloud-drizzle': [
		['path', { d: 'M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242' }],
		['path', { d: 'M8 19v1' }],
		['path', { d: 'M8 14v1' }],
		['path', { d: 'M16 19v1' }],
		['path', { d: 'M16 14v1' }],
		['path', { d: 'M12 21v1' }],
		['path', { d: 'M12 16v1' }]
	],
	'cloud-rain': [
		['path', { d: 'M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242' }],
		['path', { d: 'M16 14v6' }],
		['path', { d: 'M8 14v6' }],
		['path', { d: 'M12 16v6' }]
	],
	'cloud-snow': [
		['path', { d: 'M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242' }],
		['path', { d: 'M8 15h.01' }],
		['path', { d: 'M8 19h.01' }],
		['path', { d: 'M12 17h.01' }],
		['path', { d: 'M12 21h.01' }],
		['path', { d: 'M16 15h.01' }],
		['path', { d: 'M16 19h.01' }]
	],
	'cloud-lightning': [
		['path', { d: 'M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973' }],
		['path', { d: 'm13 12-3 5h4l-3 5' }]
	],
	radiation: [
		['path', { d: 'M12 12h.01' }],
		[
			'path',
			{
				d: 'M14 15.4641a4 4 0 0 1-4 0L7.52786 19.74597 A 1 1 0 0 0 7.99303 21.16211 10 10 0 0 0 16.00697 21.16211 1 1 0 0 0 16.47214 19.74597z'
			}
		],
		[
			'path',
			{
				d: 'M16 12a4 4 0 0 0-2-3.464l2.472-4.282a1 1 0 0 1 1.46-.305 10 10 0 0 1 4.006 6.94A1 1 0 0 1 21 12z'
			}
		],
		[
			'path',
			{
				d: 'M8 12a4 4 0 0 1 2-3.464L7.528 4.254a1 1 0 0 0-1.46-.305 10 10 0 0 0-4.006 6.94A1 1 0 0 0 3 12z'
			}
		]
	],
	anchor: [
		['path', { d: 'M12 6v16' }],
		['path', { d: 'm19 13 2-1a9 9 0 0 1-18 0l2 1' }],
		['path', { d: 'M9 11h6' }],
		['circle', { cx: '12', cy: '4', r: '2' }]
	],
	cable: [
		['path', { d: 'M17 19a1 1 0 0 1-1-1v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1z' }],
		['path', { d: 'M17 21v-2' }],
		['path', { d: 'M19 14V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V10' }],
		['path', { d: 'M21 21v-2' }],
		['path', { d: 'M3 5V3' }],
		['path', { d: 'M4 10a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2z' }],
		['path', { d: 'M7 5V3' }]
	],
	shield: [
		[
			'path',
			{
				d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'
			}
		]
	],
	flame: [
		[
			'path',
			{
				d: 'M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4'
			}
		]
	],
	'chart-column': [
		['path', { d: 'M3 3v16a2 2 0 0 0 2 2h16' }],
		['path', { d: 'M18 17V9' }],
		['path', { d: 'M13 17V5' }],
		['path', { d: 'M8 17v-3' }]
	],
	bell: [
		['path', { d: 'M10.268 21a2 2 0 0 0 3.464 0' }],
		[
			'path',
			{
				d: 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326'
			}
		]
	],
	globe: [
		['circle', { cx: '12', cy: '12', r: '10' }],
		['path', { d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' }],
		['path', { d: 'M2 12h20' }]
	],
	'trending-up': [
		['path', { d: 'M16 7h6v6' }],
		['path', { d: 'm22 7-8.5 8.5-5-5L2 17' }]
	],
	landmark: [
		['path', { d: 'M10 18v-7' }],
		[
			'path',
			{ d: 'M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z' }
		],
		['path', { d: 'M14 18v-7' }],
		['path', { d: 'M18 18v-7' }],
		['path', { d: 'M3 22h18' }],
		['path', { d: 'M6 18v-7' }]
	],
	bot: [
		['path', { d: 'M12 8V4H8' }],
		['rect', { width: '16', height: '12', x: '4', y: '8', rx: '2' }],
		['path', { d: 'M2 14h2' }],
		['path', { d: 'M20 14h2' }],
		['path', { d: 'M15 13v2' }],
		['path', { d: 'M9 13v2' }]
	],
	target: [
		['circle', { cx: '12', cy: '12', r: '10' }],
		['circle', { cx: '12', cy: '12', r: '6' }],
		['circle', { cx: '12', cy: '12', r: '2' }]
	],
	dices: [
		['rect', { width: '12', height: '12', x: '2', y: '10', rx: '2', ry: '2' }],
		['path', { d: 'm17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6' }],
		['path', { d: 'M6 18h.01' }],
		['path', { d: 'M10 14h.01' }],
		['path', { d: 'M15 6h.01' }],
		['path', { d: 'M18 9h.01' }]
	],
	map: [
		[
			'path',
			{
				d: 'M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z'
			}
		],
		['path', { d: 'M15 5.764v15' }],
		['path', { d: 'M9 3.236v15' }]
	],
	crosshair: [
		['circle', { cx: '12', cy: '12', r: '10' }],
		['line', { x1: '22', x2: '18', y1: '12', y2: '12' }],
		['line', { x1: '6', x2: '2', y1: '12', y2: '12' }],
		['line', { x1: '12', x2: '12', y1: '6', y2: '2' }],
		['line', { x1: '12', x2: '12', y1: '22', y2: '18' }]
	],
	'circle-dot': [
		['circle', { cx: '12', cy: '12', r: '1' }],
		['circle', { cx: '12', cy: '12', r: '10' }]
	],
	check: [['path', { d: 'M20 6 9 17l-5-5' }]],
	'grip-vertical': [
		['circle', { cx: '9', cy: '12', r: '1' }],
		['circle', { cx: '9', cy: '5', r: '1' }],
		['circle', { cx: '9', cy: '19', r: '1' }],
		['circle', { cx: '15', cy: '12', r: '1' }],
		['circle', { cx: '15', cy: '5', r: '1' }],
		['circle', { cx: '15', cy: '19', r: '1' }]
	]
} satisfies Record<string, IconElement[]>;

export type IconName = keyof typeof ICON_NODES;

export function getIconNodes(name: IconName): IconElement[] {
	return ICON_NODES[name];
}

export interface IconSvgOptions {
	size?: number;
	color?: string;
	strokeWidth?: number;
	class?: string;
}

/**
 * Render an icon as an SVG string for places that build HTML by hand (D3 tooltips).
 * Only registry data is interpolated; callers must pass a fixed IconName and a
 * trusted color/class.
 */
export function iconSvg(name: IconName, options: IconSvgOptions = {}): string {
	const { size = 14, color = 'currentColor', strokeWidth = 2, class: cls = '' } = options;
	const body = getIconNodes(name)
		.map(([tag, attrs]) => {
			const attributes = Object.entries(attrs)
				.map(([key, value]) => `${key}="${value}"`)
				.join(' ');
			return `<${tag} ${attributes}/>`;
		})
		.join('');
	return `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px">${body}</svg>`;
}
