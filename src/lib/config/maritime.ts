/**
 * Maritime configuration for shipping lanes and vessel tracking
 */

export interface ShippingLane {
	id: string;
	name: string;
	importance: 'critical' | 'major' | 'minor';
	points: Array<{ lat: number; lon: number }>;
	description?: string;
	threats?: string[];
}

export const SHIPPING_LANES: ShippingLane[] = [
	{
		id: 'suez',
		name: 'Suez Canal',
		importance: 'critical',
		description: 'Connects Mediterranean to Red Sea - 12% of global trade',
		threats: ['piracy', 'terrorism', 'geopolitical tension'],
		points: [
			{ lat: 31.3, lon: 32.3 },
			{ lat: 30.3, lon: 32.6 },
			{ lat: 29.4, lon: 32.7 }
		]
	},
	{
		id: 'panama',
		name: 'Panama Canal',
		importance: 'critical',
		description: 'Connects Atlantic and Pacific - 6% of global trade',
		threats: ['piracy'],
		points: [
			{ lat: 9.3, lon: -79.9 },
			{ lat: 8.9, lon: -79.5 }
		]
	},
	{
		id: 'malacca',
		name: 'Strait of Malacca',
		importance: 'critical',
		description: 'Busiest shipping lane - 25-33% of maritime trade',
		threats: ['piracy', 'terrorism'],
		points: [
			{ lat: 5.3, lon: 95.2 },
			{ lat: 2.6, lon: 101.8 }
		]
	},
	{
		id: 'hormuz',
		name: 'Strait of Hormuz',
		importance: 'critical',
		description: 'Largest oil chokepoint - 21% of global oil passes through',
		threats: ['geopolitical tension', 'naval conflict'],
		points: [
			{ lat: 26.1, lon: 55.2 },
			{ lat: 26.3, lon: 56.8 }
		]
	},
	{
		id: 'bab_el_mandeb',
		name: 'Bab el-Mandeb',
		importance: 'critical',
		description: 'Suez Canal southern entrance - gateway to Red Sea',
		threats: ['piracy', 'terrorism'],
		points: [
			{ lat: 12.6, lon: 43.3 },
			{ lat: 12.4, lon: 43.8 }
		]
	},
	{
		id: 'english_channel',
		name: 'English Channel',
		importance: 'major',
		description: 'Europe to Atlantic gateway',
		points: [
			{ lat: 50.6, lon: -5.0 },
			{ lat: 51.2, lon: 1.4 }
		]
	},
	{
		id: 'taiwan_strait',
		name: 'Taiwan Strait',
		importance: 'critical',
		description: 'Taiwan-China waters - geopolitical flashpoint',
		threats: ['geopolitical tension'],
		points: [
			{ lat: 25.5, lon: 120.8 },
			{ lat: 22.0, lon: 121.2 }
		]
	},
	{
		id: 'korea_strait',
		name: 'Korea Strait',
		importance: 'major',
		description: 'Japan-Korea connection',
		points: [
			{ lat: 36.0, lon: 129.5 },
			{ lat: 34.3, lon: 128.9 }
		]
	}
];

/**
 * Vessel type colors and sizes for map rendering
 */
export const VESSEL_COLORS: Record<string, { color: string; icon: string }> = {
	cargo: { color: '#44ff88', icon: '📦' },
	tanker: { color: '#ffaa00', icon: '⛽' },
	naval: { color: '#ff4444', icon: '🚢' },
	fishing: { color: '#4488ff', icon: '🎣' },
	container: { color: '#44ff88', icon: '📦' },
	bulk: { color: '#ffcc44', icon: '📦' },
	other: { color: '#888888', icon: '⛵' }
};

/**
 * Maritime piracy and conflict zones
 */
export const MARITIME_THREAT_ZONES = [
	{ name: 'Gulf of Aden', lat: 12.5, lon: 45.0, radius: 500, threat: 'Piracy' },
	{ name: 'Somali Waters', lat: 6.0, lon: 48.0, radius: 400, threat: 'Piracy' },
	{ name: 'Gulf of Guinea', lat: 1.0, lon: 10.0, radius: 600, threat: 'Piracy' },
	{ name: 'Red Sea', lat: 15.0, lon: 45.0, radius: 350, threat: 'Conflict' }
];
