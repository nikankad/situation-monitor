/**
 * Entity registry - every region, topic, narrative, asset and person the app can open a page for.
 *
 * Entities are built from the existing config (map regions, correlation topics, narrative
 * patterns, market symbols, world leaders), so adding something there adds it here.
 */

import { REGION_CENTERS } from './map';
import { CORRELATION_TOPICS, NARRATIVE_PATTERNS, PERSON_PATTERNS } from './analysis';
import { INDICES, SECTORS, COMMODITIES, CRYPTO } from './markets';
import { WORLD_LEADERS } from './leaders';

export type EntityType = 'region' | 'topic' | 'narrative' | 'asset' | 'person';

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
	region: 'Region',
	topic: 'Topic',
	narrative: 'Narrative',
	asset: 'Asset',
	person: 'Person'
};

export interface EntityLocation {
	lat: number;
	lon: number;
	/** Map zoom when focusing this entity */
	zoom: number;
	/** How far from the centre a strategic site still counts as nearby */
	radiusKm: number;
}

export interface Entity {
	/** Unique within its type; safe to use in a URL */
	id: string;
	type: EntityType;
	name: string;
	/** Extra words the search bar matches */
	aliases: string[];
	/** A headline mentions this entity when any matcher matches its title */
	matchers: RegExp[];
	category?: string;
	summary?: string;
	location?: EntityLocation;
	/** Market symbol for assets, as used by the markets store */
	symbol?: string;
	/** World leader record for people */
	leaderId?: string;
}

const BOUNDARY_BEFORE = '(?:^|[^A-Za-z0-9])';
const BOUNDARY_AFTER = '(?![A-Za-z0-9])';

/** Short acronyms only count in capitals, so "tells us" is not the United States */
const CASE_SENSITIVE_KEYWORDS = new Set(['us', 'uk', 'eu', 'mbs']);

/** Region keywords that match far more than their region */
const EXCLUDED_REGION_KEYWORDS = new Set([
	'persian', // "Persian Gulf" belongs to the strait, not Iran
	'korean', // also matches "North Korean"
	'arctic',
	'indian', // "Indian Ocean"
	'polish',
	'america' // "South America"
]);

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Match a keyword as a whole word or phrase
 */
export function keywordMatcher(keyword: string): RegExp {
	const word = keyword.trim();
	const caseSensitive = CASE_SENSITIVE_KEYWORDS.has(word.toLowerCase());
	const source = caseSensitive ? word.toUpperCase() : word;
	return new RegExp(
		`${BOUNDARY_BEFORE}${escapeRegExp(source)}${BOUNDARY_AFTER}`,
		caseSensitive ? '' : 'i'
	);
}

/** Copy a pattern without the global flag, which makes test() stateful across calls */
function stateless(pattern: RegExp): RegExp {
	return new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ''));
}

const ACRONYMS = new Set(['ai', 'wef', 'cbdc', 'nato', 'us', 'uk', 'eu']);

function titleCase(id: string): string {
	return id
		.split(/[-_]/)
		.map((word) =>
			ACRONYMS.has(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)
		)
		.join(' ');
}

function slug(id: string): string {
	return id.toLowerCase().replace(/_/g, '-');
}

// ---------------------------------------------------------------------------
// Regions
// ---------------------------------------------------------------------------

const REGION_LABELS: Record<string, string> = {
	usa: 'United States',
	uk: 'United Kingdom',
	strait_hormuz: 'Strait of Hormuz',
	baltic: 'Baltic Sea',
	red_sea: 'Red Sea',
	south_china_sea: 'South China Sea',
	black_sea: 'Black Sea',
	middle_east: 'Middle East'
};

const BROAD_REGIONS = new Set(['europe', 'middle_east', 'asia', 'africa', 'south_america']);
const LARGE_COUNTRIES = new Set(['russia', 'china', 'usa', 'canada', 'brazil', 'australia']);
const SMALL_AREAS = new Set([
	'israel',
	'gaza',
	'lebanon',
	'taiwan',
	'uk',
	'strait_hormuz',
	'south_china_sea',
	'red_sea',
	'baltic',
	'black_sea'
]);

/** Search radius for nearby strategic sites; 0 means no site is tracked there. The default suits a mid-sized country */
const REGION_RADIUS_KM: Record<string, number> = {
	usa: 2500,
	russia: 1500,
	china: 2200,
	canada: 0,
	brazil: 0,
	australia: 0,
	europe: 1800,
	middle_east: 1800,
	asia: 2500,
	africa: 2500,
	south_america: 2500
};
const DEFAULT_RADIUS_KM = 700;

function regionZoom(name: string): number {
	if (BROAD_REGIONS.has(name)) return 1.8;
	if (LARGE_COUNTRIES.has(name)) return 2;
	if (SMALL_AREAS.has(name)) return 4;
	return 2.8;
}

const regions: Entity[] = REGION_CENTERS.map((region) => ({
	id: slug(region.name),
	type: 'region',
	name: REGION_LABELS[region.name] ?? titleCase(region.name),
	aliases: region.keywords.map((k) => k.trim()),
	matchers: region.keywords
		.filter((k) => !EXCLUDED_REGION_KEYWORDS.has(k.trim()))
		.map((k) => keywordMatcher(k)),
	location: {
		lat: region.lat,
		lon: region.lon,
		zoom: regionZoom(region.name),
		radiusKm: REGION_RADIUS_KM[region.name] ?? DEFAULT_RADIUS_KM
	}
}));

// ---------------------------------------------------------------------------
// Topics and narratives
// ---------------------------------------------------------------------------

const TOPIC_LABELS: Record<string, string> = {
	'ai-regulation': 'AI Regulation',
	'russia-ukraine': 'Russia–Ukraine',
	'israel-gaza': 'Israel–Gaza',
	deepfake: 'Deepfakes'
};

const TOPIC_SUMMARIES: Record<string, string> = {
	tariffs:
		'Import taxes and trade restrictions between governments. They move prices, supply chains and equity sectors.',
	'fed-rates':
		'US central bank interest-rate decisions and guidance, a main driver of bond, equity and currency prices.',
	inflation: 'Consumer price growth and cost-of-living pressure, which shapes central-bank policy.',
	'ai-regulation':
		'Government rules on how AI is built and used, including safety, export controls and liability.',
	'china-tensions':
		'Strategic and economic friction between China and the US and its allies, including trade and technology controls.',
	'russia-ukraine':
		'The war in Ukraine, its sanctions regime and the energy and security effects across Europe.',
	'israel-gaza':
		'The conflict in Gaza and its regional spillover, including shipping and diplomatic effects.',
	iran: "Iran's nuclear programme, regional influence and sanctions, with Gulf shipping risk.",
	crypto:
		'Digital-asset markets and regulation, including exchange, stablecoin and fund-flow news.',
	housing: 'Home prices, mortgage rates and construction activity.',
	layoffs: 'Job cuts and hiring freezes, an early read on corporate and labour-market conditions.',
	'bank-crisis':
		'Bank failures, runs and emergency support that can spread stress through financial markets.',
	election: 'Election campaigns, results and disputes that change policy expectations.',
	immigration: 'Border policy, enforcement and migration flows.',
	climate: 'Extreme weather, climate policy and the energy transition.',
	pandemic: 'Disease outbreaks and public-health responses.',
	nuclear:
		'Nuclear weapons, energy and non-proliferation, including incidents at nuclear facilities.',
	'supply-chain': 'Disruptions to production and shipping that affect availability and prices.',
	'big-tech': 'Large technology companies: their earnings, antitrust cases and product bets.',
	deepfake: 'Synthetic media and the misinformation and fraud risks around it.'
};

const topics: Entity[] = CORRELATION_TOPICS.map((topic) => ({
	id: topic.id,
	type: 'topic',
	name: TOPIC_LABELS[topic.id] ?? titleCase(topic.id),
	aliases: [topic.id.replace(/-/g, ' '), topic.category],
	matchers: topic.patterns.map(stateless),
	category: topic.category,
	summary: TOPIC_SUMMARIES[topic.id]
}));

/** Narratives are described as claims in circulation, never as facts */
const NARRATIVE_SUMMARIES: Record<string, string> = {
	'deep-state': 'Claims that unelected officials steer policy against elected leaders.',
	'cbdc-control':
		'Claims that central-bank digital currencies would be used to surveil or control spending.',
	'wef-agenda': 'Claims that the World Economic Forum is directing a coordinated global agenda.',
	'bio-weapon':
		'Claims and debate about laboratory origins of outbreaks and biological weapons research.',
	'election-fraud': 'Claims that election results were manipulated.',
	'ai-doom': 'Warnings that advanced AI could cause catastrophic harm.',
	'ai-consciousness': 'Claims that AI systems are, or may become, conscious.',
	'robot-replacement':
		'Predictions that automation and robots will replace large parts of the workforce.',
	'china-invasion': 'Predictions of a Chinese military move against Taiwan.',
	'nato-expansion': 'Claims about NATO enlargement as a cause of tension with Russia.',
	'dollar-collapse': 'Predictions that the US dollar will lose its reserve-currency status.',
	'vaccine-injury':
		'Claims about harm from vaccines, a subject of ongoing medical and legal debate.',
	'next-pandemic': 'Predictions and warnings about a future pandemic.',
	depopulation: 'Claims of a deliberate plan to reduce the world population.',
	'food-crisis': 'Warnings of global food shortages and price spikes.',
	'energy-war': 'Claims that energy supply is being used as a weapon in geopolitical conflict.'
};

const narratives: Entity[] = NARRATIVE_PATTERNS.map((narrative) => ({
	id: narrative.id,
	type: 'narrative',
	name: titleCase(narrative.id),
	aliases: narrative.keywords,
	matchers: narrative.keywords.map((k) => keywordMatcher(k)),
	category: narrative.category,
	summary: NARRATIVE_SUMMARIES[narrative.id]
}));

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

interface AssetDefinition {
	id: string;
	symbol: string;
	name: string;
	summary: string;
	/** Headlines that could explain a move in this asset */
	patterns: RegExp[];
}

const ASSET_DEFINITIONS: AssetDefinition[] = [
	{
		id: 'dow',
		symbol: '^DJI',
		name: 'Dow Jones',
		summary: 'Price-weighted index of 30 large US companies.',
		patterns: [/\bdow\b/i, /wall street/i, /stock market/i]
	},
	{
		id: 'sp500',
		symbol: '^GSPC',
		name: 'S&P 500',
		summary: 'Index of 500 large US companies, the standard benchmark for US equities.',
		patterns: [/s&p/i, /stock market/i, /wall street/i, /earnings/i]
	},
	{
		id: 'nasdaq',
		symbol: '^IXIC',
		name: 'NASDAQ',
		summary: 'Index dominated by technology and growth companies listed on NASDAQ.',
		patterns: [/nasdaq/i, /\bchips?\b/i, /semiconductor/i, /nvidia/i, /tech stocks/i]
	},
	{
		id: 'vix',
		symbol: '^VIX',
		name: 'VIX',
		summary:
			'Expected 30-day volatility of the S&P 500. It rises when investors expect turbulence.',
		patterns: [/volatil/i, /sell-?off/i, /\bcrash/i, /\bpanic\b/i]
	},
	{
		id: 'gold',
		symbol: 'GC=F',
		name: 'Gold',
		summary:
			'Safe-haven metal that moves with real interest rates, the dollar and geopolitical stress.',
		patterns: [/\bgold\b/i, /safe.haven/i]
	},
	{
		id: 'crude-oil',
		symbol: 'CL=F',
		name: 'Crude Oil',
		summary:
			'Benchmark US crude oil futures, sensitive to Gulf supply, OPEC+ decisions and the demand outlook.',
		patterns: [/\boil\b/i, /crude/i, /opec/i, /hormuz/i]
	},
	{
		id: 'xlk',
		symbol: 'XLK',
		name: 'Tech Sector',
		summary: "SPDR fund tracking the S&P 500's technology companies.",
		patterns: [/\btech\b/i, /\bchips?\b/i, /semiconductor/i, /software/i, /nvidia/i]
	},
	{
		id: 'xlf',
		symbol: 'XLF',
		name: 'Finance Sector',
		summary: "SPDR fund tracking the S&P 500's financial companies.",
		patterns: [/\bbanks?\b/i, /lender/i, /\bcredit\b/i]
	},
	{
		id: 'xlv',
		symbol: 'XLV',
		name: 'Healthcare Sector',
		summary: "SPDR fund tracking the S&P 500's healthcare companies.",
		patterns: [/health/i, /pharma/i, /\bfda\b/i, /medicare/i]
	},
	{
		id: 'xly',
		symbol: 'XLY',
		name: 'Consumer Discretionary Sector',
		summary: "SPDR fund tracking the S&P 500's consumer discretionary companies.",
		patterns: [/\bretail/i, /consumer spending/i, /e-commerce/i, /automaker/i]
	},
	{
		id: 'xli',
		symbol: 'XLI',
		name: 'Industrials Sector',
		summary: "SPDR fund tracking the S&P 500's industrial companies.",
		patterns: [/manufacturing/i, /aerospace/i, /railroad/i, /defense contractor/i]
	},
	{
		id: 'xlp',
		symbol: 'XLP',
		name: 'Consumer Staples Sector',
		summary: "SPDR fund tracking the S&P 500's consumer staples companies.",
		patterns: [/grocery/i, /food prices/i, /consumer staples/i]
	},
	{
		id: 'xle',
		symbol: 'XLE',
		name: 'Energy Sector',
		summary: "SPDR fund tracking the S&P 500's energy companies.",
		patterns: [/\boil\b/i, /opec/i, /crude/i, /natural gas/i, /pipeline/i, /refiner/i]
	},
	{
		id: 'xlre',
		symbol: 'XLRE',
		name: 'Real Estate Sector',
		summary: "SPDR fund tracking the S&P 500's real estate companies.",
		patterns: [/housing/i, /mortgage/i, /real estate/i]
	},
	{
		id: 'xlu',
		symbol: 'XLU',
		name: 'Utilities Sector',
		summary: "SPDR fund tracking the S&P 500's utility companies.",
		patterns: [/\butilit/i, /power grid/i, /electricity/i]
	},
	{
		id: 'xlb',
		symbol: 'XLB',
		name: 'Materials Sector',
		summary: "SPDR fund tracking the S&P 500's materials companies.",
		patterns: [/mining/i, /\bsteel\b/i, /copper/i, /lumber/i, /chemical/i]
	},
	{
		id: 'btc',
		symbol: 'BTC',
		name: 'Bitcoin',
		summary: 'Largest cryptocurrency by market value.',
		patterns: [/bitcoin/i, /\bbtc\b/i, /crypto/i]
	},
	{
		id: 'eth',
		symbol: 'ETH',
		name: 'Ethereum',
		summary: 'Smart-contract platform and second-largest cryptocurrency.',
		patterns: [/ethereum/i, /\beth\b/i]
	},
	{
		id: 'sol',
		symbol: 'SOL',
		name: 'Solana',
		summary: 'High-throughput smart-contract blockchain.',
		patterns: [/solana/i, /\bsol\b/i]
	}
];

// The markets config is the source of truth for which symbols exist
const TRACKED_SYMBOLS = new Set<string>([
	...INDICES.map((i) => i.symbol),
	...SECTORS.map((s) => s.symbol),
	...COMMODITIES.map((c) => c.symbol),
	...CRYPTO.map((c) => c.symbol)
]);

const assets: Entity[] = ASSET_DEFINITIONS.filter((a) => TRACKED_SYMBOLS.has(a.symbol)).map(
	(asset) => ({
		id: asset.id,
		type: 'asset',
		name: asset.name,
		aliases: [asset.symbol, asset.id],
		matchers: asset.patterns,
		summary: asset.summary,
		symbol: asset.symbol
	})
);

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

const leaders: Entity[] = WORLD_LEADERS.map((leader) => ({
	id: leader.id,
	type: 'person',
	name: leader.name,
	aliases: [...leader.keywords, leader.country].filter(Boolean),
	matchers: leader.keywords.map((k) => keywordMatcher(k)),
	category: leader.country || undefined,
	summary: leader.bio?.background,
	leaderId: leader.id
}));

const leaderNames = WORLD_LEADERS.map((l) => l.name.toLowerCase());

/** Prominent people who are not heads of government */
const otherPeople: Entity[] = PERSON_PATTERNS.filter(
	({ name }) => !leaderNames.some((leaderName) => leaderName.includes(name.toLowerCase()))
).map(({ name, pattern }) => ({
	id: slug(name.replace(/\s+/g, '-')),
	type: 'person',
	name,
	aliases: [name],
	matchers: [stateless(pattern)]
}));

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const ENTITIES: Entity[] = [
	...regions,
	...topics,
	...narratives,
	...assets,
	...leaders,
	...otherPeople
];

export function entityKey(entity: Pick<Entity, 'type' | 'id'>): string {
	return `${entity.type}/${entity.id}`;
}

const ENTITY_BY_KEY = new Map<string, Entity>(ENTITIES.map((e) => [entityKey(e), e]));

export function getEntity(type: string, id: string): Entity | undefined {
	return ENTITY_BY_KEY.get(`${type}/${id}`);
}

/** Path of an entity page, without the app's base path */
export function entityPath(entity: Pick<Entity, 'type' | 'id'>): string {
	return `/e/${entity.type}/${entity.id}`;
}

const MATCH_CACHE_LIMIT = 4000;
const matchCache = new Map<string, Entity[]>();

/**
 * Entities a headline mentions. Results are cached by title, because the same headlines are
 * matched again on every news update.
 */
export function matchEntities(title: string): Entity[] {
	if (!title) return [];

	const cached = matchCache.get(title);
	if (cached) return cached;

	const matched = ENTITIES.filter((entity) => entity.matchers.some((m) => m.test(title)));
	if (matchCache.size >= MATCH_CACHE_LIMIT) matchCache.clear();
	matchCache.set(title, matched);
	return matched;
}
