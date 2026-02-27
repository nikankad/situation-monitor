// Map configuration - hotspots, conflict zones, and strategic locations

export interface Hotspot {
	name: string;
	lat: number;
	lon: number;
	level: 'critical' | 'high' | 'elevated' | 'low';
	desc?: string;
}

export interface ConflictZone {
	name: string;
	coords: [number, number][];
	color: string;
}

export interface Chokepoint {
	name: string;
	lat: number;
	lon: number;
	desc?: string;
}

export interface CableLanding {
	name: string;
	lat: number;
	lon: number;
	desc?: string;
}

export interface NuclearSite {
	name: string;
	lat: number;
	lon: number;
	desc?: string;
}

export interface MilitaryBase {
	name: string;
	lat: number;
	lon: number;
	desc?: string;
}

export interface Ocean {
	name: string;
	lat: number;
	lon: number;
}

export interface RegionCenter {
	name: string;
	lat: number;
	lon: number;
	keywords: string[];
}

export interface MapEvent {
	id: string;
	title: string;
	lat: number;
	lon: number;
	timestamp: number;
	severity: 'critical' | 'high' | 'elevated' | 'low';
	source: string;
	link?: string;
}

export interface ActiveConflict {
	id: string;
	name: string;
	lat: number;
	lon: number;
	type: 'conflict' | 'crisis' | 'tension' | 'development';
	severity: 'critical' | 'high' | 'elevated' | 'low';
	status: 'active' | 'escalating' | 'de-escalating' | 'frozen';
	description: string;
	startDate: string;
	lastUpdate: string;
	casualties?: string;
	parties: string[];
	keywords: string[];
}

export const THREAT_COLORS = {
	critical: '#ff0000',
	high: '#ff4444',
	elevated: '#ffcc00',
	low: '#00ff88'
} as const;

export const SANCTIONED_COUNTRY_IDS = [
	364, // Iran
	408, // North Korea
	760, // Syria
	862, // Venezuela
	112, // Belarus
	643, // Russia
	728, // South Sudan
	729 // Sudan
];

export const HOTSPOTS: Hotspot[] = [
	{
		name: 'DC',
		lat: 38.9,
		lon: -77.0,
		level: 'low'
	},
	{
		name: 'Moscow',
		lat: 55.75,
		lon: 37.6,
		level: 'elevated',
	},
	{
		name: 'Beijing',
		lat: 39.9,
		lon: 116.4,
		level: 'elevated',
	},
	{
		name: 'Kyiv',
		lat: 50.45,
		lon: 30.5,
		level: 'high',
	},
	{
		name: 'Taipei',
		lat: 25.03,
		lon: 121.5,
		level: 'elevated',
	},
	{
		name: 'Tehran',
		lat: 35.7,
		lon: 51.4,
		level: 'critical'
	},
	{
		name: 'Tel Aviv',
		lat: 32.07,
		lon: 34.78,
		level: 'high',
	},
	{
		name: 'London',
		lat: 51.5,
		lon: -0.12,
		level: 'low',
	},
	{
		name: 'Brussels',
		lat: 50.85,
		lon: 4.35,
		level: 'low',
	},
	{
		name: 'Pyongyang',
		lat: 39.03,
		lon: 125.75,
		level: 'elevated',
	},
	{
		name: 'Riyadh',
		lat: 24.7,
		lon: 46.7,
		level: 'elevated',
	},
	{
		name: 'Delhi',
		lat: 28.6,
		lon: 77.2,
		level: 'low',
	},
	{
		name: 'Singapore',
		lat: 1.35,
		lon: 103.82,
		level: 'low',
	},
	{
		name: 'Tokyo',
		lat: 35.68,
		lon: 139.76,
		level: 'low',
	},
	{
		name: 'Caracas',
		lat: 10.5,
		lon: -66.9,
		level: 'high',
	},
	{
		name: 'Nuuk',
		lat: 64.18,
		lon: -51.72,
		level: 'elevated',
	}
];

export const CONFLICT_ZONES: ConflictZone[] = [
	{
		name: 'Ukraine',
		coords: [
			[30, 52],
			[40, 52],
			[40, 45],
			[30, 45],
			[30, 52]
		],
		color: '#ff4444'
	},
	{
		name: 'Gaza',
		coords: [
			[34, 32],
			[35, 32],
			[35, 31],
			[34, 31],
			[34, 32]
		],
		color: '#ff4444'
	},
	{
		name: 'Taiwan Strait',
		coords: [
			[117, 28],
			[122, 28],
			[122, 22],
			[117, 22],
			[117, 28]
		],
		color: '#ffaa00'
	},
	{
		name: 'Yemen',
		coords: [
			[42, 19],
			[54, 19],
			[54, 12],
			[42, 12],
			[42, 19]
		],
		color: '#ff6644'
	},
	{
		name: 'Sudan',
		coords: [
			[22, 23],
			[38, 23],
			[38, 8],
			[22, 8],
			[22, 23]
		],
		color: '#ff6644'
	},
	{
		name: 'Myanmar',
		coords: [
			[92, 28],
			[101, 28],
			[101, 10],
			[92, 10],
			[92, 28]
		],
		color: '#ff8844'
	}
];

/**
 * @deprecated Use fetchConflictEventsFromGDELT() from '$lib/api/gdelt-conflicts' instead.
 * This hardcoded array is kept for backward compatibility but should not be used.
 * All conflict data should come from live GDELT API calls.
 * 
 * The dashboard now uses real-time GDELT GEO 2.0 API data for conflict events,
 * filtered using QuadClass 3 (verbal conflict) and 4 (material conflict) as per
 * the GDELT Event schema and CAMEO codebook.
 */
export const ACTIVE_CONFLICTS: ActiveConflict[] = [
	// Note: This data is deprecated. Use fetchConflictEventsFromGDELT() for live data.
	{
		id: 'ukraine-russia',
		name: 'Russia-Ukraine War',
		lat: 49.0,
		lon: 32.0,
		type: 'conflict',
		severity: 'critical',
		status: 'active',
		description: 'Full-scale military conflict since February 2022',
		startDate: '2022-02-24',
		lastUpdate: '2026-01-15',
		casualties: '500,000+',
		parties: ['Russia', 'Ukraine', 'NATO (support)'],
		keywords: ['ukraine', 'russia', 'kiev', 'donbas', 'crimea', 'putin', 'zelensky']
	},
	{
		id: 'israel-hamas',
		name: 'Israel-Hamas Conflict',
		lat: 31.5,
		lon: 34.5,
		type: 'conflict',
		severity: 'critical',
		status: 'active',
		description: 'Gaza military operations following October 7 attacks',
		startDate: '2023-10-07',
		lastUpdate: '2026-01-15',
		casualties: '45,000+',
		parties: ['Israel', 'Hamas', 'Hezbollah', 'Iran (support)'],
		keywords: ['gaza', 'israel', 'hamas', 'hostage', 'netanyahu', 'hezbollah']
	},
	{
		id: 'taiwan-strait',
		name: 'Taiwan Strait Tensions',
		lat: 24.5,
		lon: 120.5,
		type: 'tension',
		severity: 'high',
		status: 'escalating',
		description: 'Military buildup and increased Chinese activities around Taiwan',
		startDate: '2020-01-01',
		lastUpdate: '2026-01-15',
		parties: ['China', 'Taiwan', 'USA (support)'],
		keywords: ['taiwan', 'china', 'strait', 'xi', 'beijing', 'taipei']
	},
	{
		id: 'yemen-houthis',
		name: 'Yemen Crisis',
		lat: 15.5,
		lon: 48.0,
		type: 'conflict',
		severity: 'high',
		status: 'active',
		description: 'Civil war and Houthi attacks on Red Sea shipping',
		startDate: '2014-09-21',
		lastUpdate: '2026-01-15',
		casualties: '377,000+',
		parties: ['Houthis', 'Saudi Arabia', 'UAE', 'Yemen Gov'],
		keywords: ['yemen', 'houthi', 'red sea', 'saudi', 'shipping']
	},
	{
		id: 'sudan-civil-war',
		name: 'Sudan Civil War',
		lat: 15.5,
		lon: 32.5,
		type: 'conflict',
		severity: 'high',
		status: 'active',
		description: 'Armed conflict between SAF and RSF',
		startDate: '2023-04-15',
		lastUpdate: '2026-01-15',
		casualties: '20,000+',
		parties: ['SAF', 'RSF'],
		keywords: ['sudan', 'khartoum', 'rsf', 'humanitarian']
	},
	{
		id: 'myanmar-civil-war',
		name: 'Myanmar Civil War',
		lat: 21.0,
		lon: 96.0,
		type: 'conflict',
		severity: 'elevated',
		status: 'active',
		description: 'Resistance against military junta since 2021 coup',
		startDate: '2021-02-01',
		lastUpdate: '2026-01-15',
		casualties: '50,000+',
		parties: ['Military Junta', 'Resistance Forces', 'Ethnic Armies'],
		keywords: ['myanmar', 'burma', 'coup', 'rohingya']
	},
	{
		id: 'north-korea-threats',
		name: 'North Korea Nuclear Program',
		lat: 40.0,
		lon: 127.5,
		type: 'tension',
		severity: 'elevated',
		status: 'active',
		description: 'Nuclear weapons development and missile tests',
		startDate: '2006-10-09',
		lastUpdate: '2026-01-15',
		parties: ['North Korea', 'South Korea', 'USA', 'Japan'],
		keywords: ['north korea', 'nuclear', 'missile', 'kim jong', 'pyongyang']
	},
	{
		id: 'iran-nuclear',
		name: 'Iran Nuclear Crisis',
		lat: 32.0,
		lon: 53.0,
		type: 'crisis',
		severity: 'high',
		status: 'escalating',
		description: 'Nuclear program tensions and regional proxy conflicts',
		startDate: '2018-05-08',
		lastUpdate: '2026-01-15',
		parties: ['Iran', 'Israel', 'USA', 'IAEA'],
		keywords: ['iran', 'nuclear', 'tehran', 'irgc', 'sanctions']
	},
	{
		id: 'ethiopia-tigray',
		name: 'Ethiopia-Tigray Conflict',
		lat: 14.0,
		lon: 38.5,
		type: 'conflict',
		severity: 'elevated',
		status: 'frozen',
		description: 'Ceasefire holding but tensions remain',
		startDate: '2020-11-04',
		lastUpdate: '2026-01-15',
		casualties: '600,000+',
		parties: ['Ethiopia Gov', 'Tigray Forces'],
		keywords: ['ethiopia', 'tigray', 'humanitarian']
	},
	{
		id: 'south-china-sea',
		name: 'South China Sea Disputes',
		lat: 12.0,
		lon: 114.0,
		type: 'tension',
		severity: 'elevated',
		status: 'active',
		description: 'Territorial disputes and militarization',
		startDate: '2013-01-01',
		lastUpdate: '2026-01-15',
		parties: ['China', 'Philippines', 'Vietnam', 'Malaysia'],
		keywords: ['south china sea', 'spratly', 'philippines', 'vietnam']
	},
	{
		id: 'sahel-insurgency',
		name: 'Sahel Insurgency',
		lat: 15.0,
		lon: 0.0,
		type: 'conflict',
		severity: 'high',
		status: 'active',
		description: 'Islamist insurgency across West Africa',
		startDate: '2012-01-01',
		lastUpdate: '2026-01-15',
		casualties: '40,000+',
		parties: ['JNIM', 'ISIS-Sahel', 'Regional Forces'],
		keywords: ['sahel', 'mali', 'burkina faso', 'niger', 'jihadist']
	}
];

export const CHOKEPOINTS: Chokepoint[] = [
	{
		name: 'Suez Canal',
		lat: 30.0,
		lon: 32.5,
		desc: 'Suez Canal - Critical maritime route connecting Mediterranean & Red Sea. ~12% of global trade, 30% of container traffic. Length: 193km. Transit time: 12-16 hours.'
	},
	{
		name: 'Panama Canal',
		lat: 9.1,
		lon: -79.7,
		desc: 'Panama Canal - Vital Pacific-Atlantic link. ~6% of global maritime trade. 14,000+ ships/year. Saves 8,000 nautical miles vs. Cape Horn route.'
	},
	{
		name: 'Strait of Hormuz',
		lat: 26.5,
		lon: 56.5,
		desc: 'Strait of Hormuz - World\'s most important oil transit chokepoint. 21 million barrels/day (~21% of global petroleum). Only 2 miles wide at narrowest point. Iran strategic leverage.'
	},
	{
		name: 'Strait of Malacca',
		lat: 2.5,
		lon: 101.0,
		desc: 'Strait of Malacca - Busiest shipping lane globally. 25% of traded goods, 80,000+ vessels/year. Links Indian Ocean to Pacific. Critical for China, Japan, S. Korea energy security.'
	},
	{
		name: 'Bab el-Mandeb',
		lat: 12.5,
		lon: 43.3,
		desc: 'Bab el-Mandeb Strait - "Gate of Tears" between Red Sea & Gulf of Aden. 6.7M barrels oil/day. 18 miles wide. Vulnerable to Houthi attacks from Yemen. Critical for Suez access.'
	},
	{
		name: 'Bosporus Strait',
		lat: 41.1,
		lon: 29.0,
		desc: 'Bosporus Strait - Only passage from Black Sea to Mediterranean. ~48,000 vessels/year, 3M barrels oil/day. Turkey controls access per Montreux Convention. 700m wide at narrowest.'
	}
];

export const CABLE_LANDINGS: CableLanding[] = [
];

export const NUCLEAR_SITES: NuclearSite[] = [
	{
		name: 'Zaporizhzhia',
		lat: 47.5,
		lon: 34.6,
	},
];

export const MILITARY_BASES: MilitaryBase[] = [
	{
		name: 'Diego Garcia',
		lat: -7.3,
		lon: 72.4,
	},
	{
		name: 'Okinawa',
		lat: 26.5,
		lon: 127.9,
	},
	{
		name: 'Djibouti',
		lat: 11.5,
		lon: 43.1,
	},
	{
		name: 'Kaliningrad',
		lat: 54.7,
		lon: 20.5,
	},
	{
		name: 'Hainan',
		lat: 18.2,
		lon: 109.5,
	}
];

export const OCEANS: Ocean[] = [
	{ name: 'ATLANTIC', lat: 25, lon: -40 },
	{ name: 'PACIFIC', lat: 0, lon: -150 },
	{ name: 'INDIAN', lat: -20, lon: 75 },
	{ name: 'ARCTIC', lat: 75, lon: 0 },
	{ name: 'SOUTHERN', lat: -60, lon: 0 }
];

export const WEATHER_CODES: Record<number, string> = {
	0: '☀️ Clear',
	1: '🌤️ Mostly clear',
	2: '⛅ Partly cloudy',
	3: '☁️ Overcast',
	45: '🌫️ Fog',
	48: '🌫️ Fog',
	51: '🌧️ Drizzle',
	53: '🌧️ Drizzle',
	55: '🌧️ Drizzle',
	61: '🌧️ Rain',
	63: '🌧️ Rain',
	65: '🌧️ Heavy rain',
	71: '🌨️ Snow',
	73: '🌨️ Snow',
	75: '🌨️ Heavy snow',
	77: '🌨️ Snow',
	80: '🌧️ Showers',
	81: '🌧️ Showers',
	82: '⛈️ Heavy showers',
	85: '🌨️ Snow',
	86: '🌨️ Snow',
	95: '⛈️ Thunderstorm',
	96: '⛈️ Thunderstorm',
	99: '⛈️ Thunderstorm'
};

// Region centers for geo-locating news items
export const REGION_CENTERS: RegionCenter[] = [
	// Specific countries/cities (highest priority - check first)
	{ name: 'ukraine', lat: 49.0, lon: 32.0, keywords: ['ukraine', 'kyiv', 'kiev', 'zelensky', 'crimea', 'donbas', 'kherson', 'bakhmut'] },
	{ name: 'russia', lat: 55.75, lon: 37.6, keywords: ['russia', 'moscow', 'kremlin', 'putin', 'russian'] },
	{ name: 'china', lat: 35.0, lon: 105.0, keywords: ['china', 'beijing', 'chinese', 'xi jinping', 'ccp'] },
	{ name: 'taiwan', lat: 23.5, lon: 121.0, keywords: ['taiwan', 'taipei', 'taiwanese', 'tsmc'] },
	{ name: 'iran', lat: 32.0, lon: 53.0, keywords: ['iran', 'tehran', 'iranian', 'khamenei', 'irgc', 'persian'] },
	{ name: 'israel', lat: 31.5, lon: 35.0, keywords: ['israel', 'israeli', 'tel aviv', 'jerusalem', 'netanyahu', 'idf'] },
	{ name: 'gaza', lat: 31.5, lon: 34.45, keywords: ['gaza', 'hamas', 'palestinian'] },
	{ name: 'north_korea', lat: 40.0, lon: 127.0, keywords: ['north korea', 'pyongyang', 'kim jong', 'dprk'] },
	{ name: 'south_korea', lat: 36.5, lon: 127.8, keywords: ['south korea', 'seoul', 'korean'] },
	{ name: 'japan', lat: 36.0, lon: 138.0, keywords: ['japan', 'tokyo', 'japanese'] },
	{ name: 'india', lat: 22.0, lon: 78.0, keywords: ['india', 'delhi', 'modi', 'indian'] },
	{ name: 'pakistan', lat: 30.0, lon: 70.0, keywords: ['pakistan', 'islamabad', 'pakistani'] },
	{ name: 'saudi', lat: 24.0, lon: 45.0, keywords: ['saudi', 'riyadh', 'mbs', 'arabia'] },
	{ name: 'syria', lat: 35.0, lon: 38.0, keywords: ['syria', 'syrian', 'damascus', 'assad'] },
	{ name: 'iraq', lat: 33.0, lon: 44.0, keywords: ['iraq', 'iraqi', 'baghdad'] },
	{ name: 'yemen', lat: 15.5, lon: 48.0, keywords: ['yemen', 'houthi', 'sanaa'] },
	{ name: 'lebanon', lat: 33.9, lon: 35.5, keywords: ['lebanon', 'beirut', 'hezbollah'] },
	{ name: 'turkey', lat: 39.0, lon: 35.0, keywords: ['turkey', 'turkish', 'ankara', 'erdogan'] },
	{ name: 'germany', lat: 51.0, lon: 10.0, keywords: ['germany', 'german', 'berlin', 'scholz'] },
	{ name: 'france', lat: 46.0, lon: 2.0, keywords: ['france', 'french', 'paris', 'macron'] },
	{ name: 'uk', lat: 54.0, lon: -2.0, keywords: ['britain', 'british', 'uk', 'london', 'england'] },
	{ name: 'poland', lat: 52.0, lon: 19.0, keywords: ['poland', 'polish', 'warsaw'] },
	{ name: 'venezuela', lat: 8.0, lon: -66.0, keywords: ['venezuela', 'caracas', 'maduro', 'venezuelan'] },
	{ name: 'brazil', lat: -14.0, lon: -51.0, keywords: ['brazil', 'brazilian', 'brasilia'] },
	{ name: 'mexico', lat: 23.0, lon: -102.0, keywords: ['mexico', 'mexican'] },
	{ name: 'canada', lat: 56.0, lon: -106.0, keywords: ['canada', 'canadian', 'ottawa', 'trudeau'] },
	{ name: 'greenland', lat: 72.0, lon: -40.0, keywords: ['greenland', 'nuuk', 'arctic'] },
	{ name: 'sudan', lat: 15.0, lon: 30.0, keywords: ['sudan', 'sudanese', 'khartoum'] },
	{ name: 'ethiopia', lat: 9.0, lon: 39.0, keywords: ['ethiopia', 'ethiopian', 'addis'] },
	{ name: 'somalia', lat: 5.0, lon: 46.0, keywords: ['somalia', 'somali', 'mogadishu'] },
	{ name: 'myanmar', lat: 21.0, lon: 96.0, keywords: ['myanmar', 'burma', 'burmese'] },
	{ name: 'philippines', lat: 13.0, lon: 122.0, keywords: ['philippines', 'filipino', 'manila'] },
	{ name: 'indonesia', lat: -2.0, lon: 118.0, keywords: ['indonesia', 'indonesian', 'jakarta'] },
	{ name: 'australia', lat: -25.0, lon: 134.0, keywords: ['australia', 'australian', 'canberra', 'sydney'] },
	{ name: 'usa', lat: 39.0, lon: -98.0, keywords: ['united states', 'u.s.', 'us ', 'america', 'washington', 'white house', 'pentagon', 'congress', 'biden', 'trump'] },

	// Regions (lower priority - fallback)
	{ name: 'europe', lat: 50.0, lon: 10.0, keywords: ['europe', 'european', 'eu ', 'nato'] },
	{ name: 'middle_east', lat: 29.0, lon: 42.0, keywords: ['middle east', 'mideast'] },
	{ name: 'asia', lat: 35.0, lon: 105.0, keywords: ['asia', 'asian'] },
	{ name: 'africa', lat: 0.0, lon: 20.0, keywords: ['africa', 'african', 'sahel'] },
	{ name: 'south_america', lat: -15.0, lon: -60.0, keywords: ['south america', 'latin america'] },

	// Strategic locations
	{ name: 'south_china_sea', lat: 15.0, lon: 115.0, keywords: ['south china sea', 'spratly', 'paracel'] },
	{ name: 'strait_hormuz', lat: 26.5, lon: 56.5, keywords: ['hormuz', 'persian gulf'] },
	{ name: 'red_sea', lat: 20.0, lon: 38.0, keywords: ['red sea', 'bab el-mandeb', 'suez'] },
	{ name: 'baltic', lat: 58.0, lon: 20.0, keywords: ['baltic', 'kaliningrad'] },
	{ name: 'black_sea', lat: 43.0, lon: 35.0, keywords: ['black sea', 'crimea', 'sevastopol'] }
];

// Get coordinates for a news item based on title keywords
export function getNewsCoordinates(title: string): { lat: number; lon: number; region: string } | null {
	const lowerTitle = title.toLowerCase();

	for (const region of REGION_CENTERS) {
		for (const keyword of region.keywords) {
			if (lowerTitle.includes(keyword)) {
				return { lat: region.lat, lon: region.lon, region: region.name };
			}
		}
	}

	return null;
}
