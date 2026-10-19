// Map configuration - hotspots and strategic locations

export interface Hotspot {
	name: string;
	lat: number;
	lon: number;
	level: 'critical' | 'high' | 'elevated' | 'low';
	desc?: string;
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

export const THREAT_COLORS = {
	critical: '#ff2d55',
	high: '#ff8a1f',
	elevated: '#ffd60a',
	low: '#3ddc84'
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
		level: 'low',
		desc: 'Washington, DC - US seat of government; policy decisions here move markets and alliances.'
	},
	{
		name: 'Moscow',
		lat: 55.75,
		lon: 37.6,
		level: 'elevated',
		desc: 'Moscow - Russian leadership and command centre for the war in Ukraine; sanctions and nuclear signaling originate here.'
	},
	{
		name: 'Beijing',
		lat: 39.9,
		lon: 116.4,
		level: 'elevated',
		desc: 'Beijing - Chinese leadership; focal point for Taiwan, South China Sea and US-China trade tensions.'
	},
	{
		name: 'Kyiv',
		lat: 50.45,
		lon: 30.5,
		level: 'high',
		desc: 'Kyiv - Ukrainian capital and political centre of the defence against the Russian invasion.'
	},
	{
		name: 'Taipei',
		lat: 25.03,
		lon: 121.5,
		level: 'elevated',
		desc: 'Taipei - Capital of Taiwan; the Taiwan Strait is a key flashpoint between China and the US.'
	},
	{
		name: 'Tehran',
		lat: 35.7,
		lon: 51.4,
		level: 'critical',
		desc: 'Tehran - Iranian leadership; nuclear programme, regional proxy networks and Gulf shipping risk.'
	},
	{
		name: 'Tel Aviv',
		lat: 32.07,
		lon: 34.78,
		level: 'high',
		desc: 'Tel Aviv - Israeli political and economic centre; focal point of the Gaza and wider regional conflict.'
	},
	{
		name: 'London',
		lat: 51.5,
		lon: -0.12,
		level: 'low',
		desc: 'London - UK government and a major financial centre; NATO and sanctions coordination.'
	},
	{
		name: 'Brussels',
		lat: 50.85,
		lon: 4.35,
		level: 'low',
		desc: 'Brussels - EU and NATO headquarters; sanctions, defence and trade policy.'
	},
	{
		name: 'Pyongyang',
		lat: 39.03,
		lon: 125.75,
		level: 'elevated',
		desc: 'Pyongyang - North Korean leadership; missile tests and nuclear escalation risk.'
	},
	{
		name: 'Riyadh',
		lat: 24.7,
		lon: 46.7,
		level: 'elevated',
		desc: 'Riyadh - Saudi leadership; OPEC+ oil policy and Gulf diplomacy.'
	},
	{
		name: 'Delhi',
		lat: 28.6,
		lon: 77.2,
		level: 'low',
		desc: 'New Delhi - Indian government; border tensions with China and Pakistan, and a growing diplomatic swing state.'
	},
	{
		name: 'Singapore',
		lat: 1.35,
		lon: 103.82,
		level: 'low',
		desc: 'Singapore - Key financial and shipping hub beside the Strait of Malacca.'
	},
	{
		name: 'Tokyo',
		lat: 35.68,
		lon: 139.76,
		level: 'low',
		desc: 'Tokyo - Japanese government; regional security alignment with the US amid China and North Korea tensions.'
	},
	{
		name: 'Caracas',
		lat: 10.5,
		lon: -66.9,
		level: 'high',
		desc: 'Caracas - Venezuelan government; sanctions, oil and regional instability.'
	},
	{
		name: 'Nuuk',
		lat: 64.18,
		lon: -51.72,
		level: 'elevated',
		desc: 'Nuuk - Capital of Greenland; Arctic strategic interest and US-Denmark-Greenland tensions.'
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
		desc: "Strait of Hormuz - World's most important oil transit chokepoint. 21 million barrels/day (~21% of global petroleum). Only 2 miles wide at narrowest point. Iran strategic leverage."
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

export const CABLE_LANDINGS: CableLanding[] = [];

export const NUCLEAR_SITES: NuclearSite[] = [
	{
		name: 'Zaporizhzhia',
		lat: 47.5,
		lon: 34.6,
		desc: "Zaporizhzhia NPP - Europe's largest nuclear power plant (6 reactors). Under Russian occupation since March 2022, with repeated shelling and off-site power losses."
	},
	{
		name: 'Natanz',
		lat: 33.72,
		lon: 51.73,
		desc: "Natanz - Iran's main uranium enrichment complex, a recurring focus of IAEA inspections and sabotage."
	},
	{
		name: 'Bushehr',
		lat: 28.83,
		lon: 50.89,
		desc: "Bushehr NPP - Iran's only operating commercial nuclear power plant, built with Russian assistance."
	},
	{
		name: 'Dimona',
		lat: 31.0,
		lon: 35.15,
		desc: "Negev Nuclear Research Center (Dimona) - Israel's undeclared nuclear facility."
	},
	{
		name: 'Yongbyon',
		lat: 39.8,
		lon: 125.75,
		desc: "Yongbyon - North Korea's main nuclear complex: reactor, reprocessing and enrichment facilities."
	}
];

export const MILITARY_BASES: MilitaryBase[] = [
	{
		name: 'Diego Garcia',
		lat: -7.3,
		lon: 72.4,
		desc: 'Diego Garcia - Joint US/UK base in the Indian Ocean; bomber and naval logistics hub.'
	},
	{
		name: 'Okinawa',
		lat: 26.5,
		lon: 127.9,
		desc: 'Okinawa - Largest concentration of US forces in Japan, including Kadena Air Base; 400 miles from Taiwan.'
	},
	{
		name: 'Djibouti',
		lat: 11.5,
		lon: 43.1,
		desc: "Djibouti - Hosts US Camp Lemonnier and China's first overseas military base, overlooking Bab el-Mandeb."
	},
	{
		name: 'Kaliningrad',
		lat: 54.7,
		lon: 20.5,
		desc: 'Kaliningrad - Russian exclave between Poland and Lithuania; home of the Baltic Fleet and Iskander missiles.'
	},
	{
		name: 'Hainan',
		lat: 18.2,
		lon: 109.5,
		desc: 'Hainan (Yulin) - PLA Navy submarine and carrier base facing the South China Sea.'
	},
	{
		name: 'Guam',
		lat: 13.58,
		lon: 144.93,
		desc: "Guam - Andersen Air Force Base and Naval Base Guam; the US's forward hub in the western Pacific."
	},
	{
		name: 'Ramstein',
		lat: 49.44,
		lon: 7.6,
		desc: 'Ramstein Air Base - US Air Forces in Europe headquarters and key logistics hub for NATO.'
	},
	{
		name: 'Al Udeid',
		lat: 25.12,
		lon: 51.32,
		desc: 'Al Udeid Air Base (Qatar) - Forward headquarters of US Central Command air operations.'
	},
	{
		name: 'Sevastopol',
		lat: 44.62,
		lon: 33.53,
		desc: "Sevastopol - Home port of Russia's Black Sea Fleet, in occupied Crimea."
	}
];

export const OCEANS: Ocean[] = [
	{ name: 'ATLANTIC', lat: 25, lon: -40 },
	{ name: 'PACIFIC', lat: 0, lon: -150 },
	{ name: 'INDIAN', lat: -20, lon: 75 },
	{ name: 'ARCTIC', lat: 75, lon: 0 },
	{ name: 'SOUTHERN', lat: -60, lon: 0 }
];

export type WeatherIcon =
	| 'sun'
	| 'cloud-sun'
	| 'cloud'
	| 'cloud-fog'
	| 'cloud-drizzle'
	| 'cloud-rain'
	| 'cloud-snow'
	| 'cloud-lightning';

export interface WeatherCondition {
	label: string;
	icon: WeatherIcon;
}

/** Open-Meteo WMO weather interpretation codes */
export const WEATHER_CODES: Record<number, WeatherCondition> = {
	0: { label: 'Clear', icon: 'sun' },
	1: { label: 'Mostly clear', icon: 'sun' },
	2: { label: 'Partly cloudy', icon: 'cloud-sun' },
	3: { label: 'Overcast', icon: 'cloud' },
	45: { label: 'Fog', icon: 'cloud-fog' },
	48: { label: 'Fog', icon: 'cloud-fog' },
	51: { label: 'Drizzle', icon: 'cloud-drizzle' },
	53: { label: 'Drizzle', icon: 'cloud-drizzle' },
	55: { label: 'Drizzle', icon: 'cloud-drizzle' },
	61: { label: 'Rain', icon: 'cloud-rain' },
	63: { label: 'Rain', icon: 'cloud-rain' },
	65: { label: 'Heavy rain', icon: 'cloud-rain' },
	71: { label: 'Snow', icon: 'cloud-snow' },
	73: { label: 'Snow', icon: 'cloud-snow' },
	75: { label: 'Heavy snow', icon: 'cloud-snow' },
	77: { label: 'Snow', icon: 'cloud-snow' },
	80: { label: 'Showers', icon: 'cloud-rain' },
	81: { label: 'Showers', icon: 'cloud-rain' },
	82: { label: 'Heavy showers', icon: 'cloud-rain' },
	85: { label: 'Snow showers', icon: 'cloud-snow' },
	86: { label: 'Snow showers', icon: 'cloud-snow' },
	95: { label: 'Thunderstorm', icon: 'cloud-lightning' },
	96: { label: 'Thunderstorm', icon: 'cloud-lightning' },
	99: { label: 'Thunderstorm', icon: 'cloud-lightning' }
};

// Region centers for geo-locating news items
export const REGION_CENTERS: RegionCenter[] = [
	// Specific countries/cities (highest priority - check first)
	{
		name: 'ukraine',
		lat: 49.0,
		lon: 32.0,
		keywords: ['ukraine', 'kyiv', 'kiev', 'zelensky', 'crimea', 'donbas', 'kherson', 'bakhmut']
	},
	{
		name: 'russia',
		lat: 55.75,
		lon: 37.6,
		keywords: ['russia', 'moscow', 'kremlin', 'putin', 'russian']
	},
	{
		name: 'china',
		lat: 35.0,
		lon: 105.0,
		keywords: ['china', 'beijing', 'chinese', 'xi jinping', 'ccp']
	},
	{ name: 'taiwan', lat: 23.5, lon: 121.0, keywords: ['taiwan', 'taipei', 'taiwanese', 'tsmc'] },
	{
		name: 'iran',
		lat: 32.0,
		lon: 53.0,
		keywords: ['iran', 'tehran', 'iranian', 'khamenei', 'irgc', 'persian']
	},
	{
		name: 'israel',
		lat: 31.5,
		lon: 35.0,
		keywords: ['israel', 'israeli', 'tel aviv', 'jerusalem', 'netanyahu', 'idf']
	},
	{ name: 'gaza', lat: 31.5, lon: 34.45, keywords: ['gaza', 'hamas', 'palestinian'] },
	{
		name: 'north_korea',
		lat: 40.0,
		lon: 127.0,
		keywords: ['north korea', 'pyongyang', 'kim jong', 'dprk']
	},
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
	{
		name: 'venezuela',
		lat: 8.0,
		lon: -66.0,
		keywords: ['venezuela', 'caracas', 'maduro', 'venezuelan']
	},
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
	{
		name: 'australia',
		lat: -25.0,
		lon: 134.0,
		keywords: ['australia', 'australian', 'canberra', 'sydney']
	},
	{
		name: 'usa',
		lat: 39.0,
		lon: -98.0,
		keywords: [
			'united states',
			'u.s.',
			'us ',
			'america',
			'washington',
			'white house',
			'pentagon',
			'congress',
			'biden',
			'trump'
		]
	},

	// Regions (lower priority - fallback)
	{ name: 'europe', lat: 50.0, lon: 10.0, keywords: ['europe', 'european', 'eu ', 'nato'] },
	{ name: 'middle_east', lat: 29.0, lon: 42.0, keywords: ['middle east', 'mideast'] },
	{ name: 'asia', lat: 35.0, lon: 105.0, keywords: ['asia', 'asian'] },
	{ name: 'africa', lat: 0.0, lon: 20.0, keywords: ['africa', 'african', 'sahel'] },
	{ name: 'south_america', lat: -15.0, lon: -60.0, keywords: ['south america', 'latin america'] },

	// Strategic locations
	{
		name: 'south_china_sea',
		lat: 15.0,
		lon: 115.0,
		keywords: ['south china sea', 'spratly', 'paracel']
	},
	{ name: 'strait_hormuz', lat: 26.5, lon: 56.5, keywords: ['hormuz', 'persian gulf'] },
	{ name: 'red_sea', lat: 20.0, lon: 38.0, keywords: ['red sea', 'bab el-mandeb', 'suez'] },
	{ name: 'baltic', lat: 58.0, lon: 20.0, keywords: ['baltic', 'kaliningrad'] },
	{ name: 'black_sea', lat: 43.0, lon: 35.0, keywords: ['black sea', 'crimea', 'sevastopol'] }
];

// Get coordinates for a news item based on title keywords
export function getNewsCoordinates(
	title: string
): { lat: number; lon: number; region: string } | null {
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
