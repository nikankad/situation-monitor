/**
 * Analysis configuration - correlation topics, narrative patterns, source classification
 */

export interface CorrelationTopic {
	id: string;
	patterns: RegExp[];
	category: string;
}

export interface NarrativePattern {
	id: string;
	keywords: string[];
	category: string;
	severity: 'watch' | 'emerging' | 'spreading' | 'disinfo';
}

export interface SourceTypes {
	fringe: string[];
	alternative: string[];
	mainstream: string[];
}

export const CORRELATION_TOPICS: CorrelationTopic[] = [
	{
		id: 'tariffs',
		patterns: [/tariff/i, /trade war/i, /import tax/i, /customs duty/i],
		category: 'Economy'
	},
	{
		id: 'fed-rates',
		patterns: [/federal reserve/i, /interest rate/i, /rate cut/i, /rate hike/i, /powell/i, /fomc/i],
		category: 'Economy'
	},
	{
		id: 'inflation',
		patterns: [/inflation/i, /cpi/i, /consumer price/i, /cost of living/i],
		category: 'Economy'
	},
	{
		id: 'ai-regulation',
		patterns: [/ai regulation/i, /artificial intelligence.*law/i, /ai safety/i, /ai governance/i],
		category: 'Tech'
	},
	{
		id: 'china-tensions',
		patterns: [/china.*taiwan/i, /south china sea/i, /us.*china/i, /beijing.*washington/i],
		category: 'Geopolitics'
	},
	{
		id: 'russia-ukraine',
		patterns: [/ukraine/i, /zelensky/i, /putin.*war/i, /crimea/i, /donbas/i],
		category: 'Conflict'
	},
	{
		id: 'israel-gaza',
		patterns: [/gaza/i, /hamas/i, /netanyahu/i, /israel.*attack/i, /hostage/i],
		category: 'Conflict'
	},
	{
		id: 'iran',
		patterns: [/iran.*nuclear/i, /tehran/i, /ayatollah/i, /iranian.*strike/i],
		category: 'Geopolitics'
	},
	{
		id: 'crypto',
		patterns: [/bitcoin/i, /crypto.*regulation/i, /ethereum/i, /sec.*crypto/i],
		category: 'Finance'
	},
	{
		id: 'housing',
		patterns: [/housing market/i, /mortgage rate/i, /home price/i, /real estate.*crash/i],
		category: 'Economy'
	},
	{
		id: 'layoffs',
		patterns: [/layoff/i, /job cut/i, /workforce reduction/i, /downsizing/i],
		category: 'Business'
	},
	{
		id: 'bank-crisis',
		patterns: [/bank.*fail/i, /banking crisis/i, /fdic/i, /bank run/i],
		category: 'Finance'
	},
	{
		id: 'election',
		patterns: [/election/i, /polling/i, /campaign/i, /ballot/i, /voter/i],
		category: 'Politics'
	},
	{
		id: 'immigration',
		patterns: [/immigration/i, /border.*crisis/i, /migrant/i, /deportation/i, /asylum/i],
		category: 'Politics'
	},
	{
		id: 'climate',
		patterns: [/climate change/i, /wildfire/i, /hurricane/i, /extreme weather/i, /flood/i],
		category: 'Environment'
	},
	{
		id: 'pandemic',
		patterns: [/pandemic/i, /outbreak/i, /virus.*spread/i, /who.*emergency/i, /bird flu/i],
		category: 'Health'
	},
	{
		id: 'nuclear',
		patterns: [/nuclear.*threat/i, /nuclear weapon/i, /atomic/i, /icbm/i],
		category: 'Security'
	},
	{
		id: 'supply-chain',
		patterns: [/supply chain/i, /shipping.*delay/i, /port.*congestion/i, /logistics.*crisis/i],
		category: 'Economy'
	},
	{
		id: 'big-tech',
		patterns: [/antitrust.*tech/i, /google.*monopoly/i, /meta.*lawsuit/i, /apple.*doj/i],
		category: 'Tech'
	},
	{
		id: 'deepfake',
		patterns: [/deepfake/i, /ai.*misinformation/i, /synthetic media/i],
		category: 'Tech'
	}
];

export const NARRATIVE_PATTERNS: NarrativePattern[] = [
	{
		id: 'deep-state',
		keywords: ['deep state', 'shadow government', 'permanent state'],
		category: 'Political',
		severity: 'watch'
	},
	{
		id: 'cbdc-control',
		keywords: ['cbdc control', 'digital currency surveillance', 'social credit'],
		category: 'Finance',
		severity: 'watch'
	},
	{
		id: 'wef-agenda',
		keywords: ['great reset', 'wef agenda', 'world economic forum plot'],
		category: 'Political',
		severity: 'watch'
	},
	{
		id: 'bio-weapon',
		keywords: ['lab leak', 'bioweapon', 'gain of function'],
		category: 'Health',
		severity: 'emerging'
	},
	{
		id: 'election-fraud',
		keywords: ['election fraud', 'rigged election', 'stolen election', 'mail ballot fraud'],
		category: 'Political',
		severity: 'watch'
	},
	{
		id: 'ai-doom',
		keywords: ['ai doom', 'ai extinction', 'superintelligence risk', 'agi danger'],
		category: 'Tech',
		severity: 'emerging'
	},
	{
		id: 'ai-consciousness',
		keywords: ['ai sentient', 'ai conscious', 'ai feelings', 'ai alive'],
		category: 'Tech',
		severity: 'emerging'
	},
	{
		id: 'robot-replacement',
		keywords: ['robots replacing', 'automation unemployment', 'job automation'],
		category: 'Economy',
		severity: 'spreading'
	},
	{
		id: 'china-invasion',
		keywords: ['china taiwan invasion', 'china war', 'south china sea conflict'],
		category: 'Geopolitical',
		severity: 'watch'
	},
	{
		id: 'nato-expansion',
		keywords: ['nato provocation', 'nato aggression', 'nato encirclement'],
		category: 'Geopolitical',
		severity: 'watch'
	},
	{
		id: 'dollar-collapse',
		keywords: ['dollar collapse', 'dedollarization', 'brics currency', 'petrodollar death'],
		category: 'Finance',
		severity: 'spreading'
	},
	{
		id: 'vaccine-injury',
		keywords: ['vaccine injury', 'vaccine side effect', 'vaccine death', 'turbo cancer'],
		category: 'Health',
		severity: 'watch'
	},
	{
		id: 'next-pandemic',
		keywords: ['next pandemic', 'disease x', 'bird flu pandemic'],
		category: 'Health',
		severity: 'emerging'
	},
	{
		id: 'depopulation',
		keywords: ['depopulation agenda', 'fertility crisis', 'population control'],
		category: 'Society',
		severity: 'disinfo'
	},
	{
		id: 'food-crisis',
		keywords: ['food shortage', 'engineered famine', 'food supply attack'],
		category: 'Economy',
		severity: 'emerging'
	},
	{
		id: 'energy-war',
		keywords: ['energy crisis manufactured', 'green agenda', 'energy shortage'],
		category: 'Economy',
		severity: 'spreading'
	}
];

export const SOURCE_TYPES: SourceTypes = {
	fringe: [
		'zerohedge',
		'infowars',
		'naturalnews',
		'gateway',
		'breitbart',
		'epoch',
		'revolver',
		'dailycaller'
	],
	alternative: ['substack', 'rumble', 'bitchute', 'telegram', 'gab', 'gettr', 'truth social'],
	mainstream: [
		'reuters',
		'ap news',
		'bbc',
		'cnn',
		'nytimes',
		'wsj',
		'wapo',
		'guardian',
		'abc',
		'nbc',
		'cbs',
		'fox'
	]
};

// Main character patterns for tracking prominent figures
export interface PersonPattern {
	pattern: RegExp;
	name: string;
}

export const PERSON_PATTERNS: PersonPattern[] = [
	{ pattern: /\btrump\b/gi, name: 'Trump' },
	{ pattern: /\bbiden\b/gi, name: 'Biden' },
	{ pattern: /\belon\b|\bmusk\b/gi, name: 'Elon Musk' },
	{ pattern: /\bputin\b/gi, name: 'Putin' },
	{ pattern: /\bzelensky\b/gi, name: 'Zelensky' },
	{ pattern: /\bxi\s*jinping\b|\bxi\b/gi, name: 'Xi Jinping' },
	{ pattern: /\bnetanyahu\b/gi, name: 'Netanyahu' },
	{ pattern: /\bsam\s*altman\b/gi, name: 'Sam Altman' },
	{ pattern: /\bmark\s*zuckerberg\b|\bzuckerberg\b/gi, name: 'Zuckerberg' },
	{ pattern: /\bjeff\s*bezos\b|\bbezos\b/gi, name: 'Bezos' },
	{ pattern: /\btim\s*cook\b/gi, name: 'Tim Cook' },
	{ pattern: /\bsatya\s*nadella\b|\bnadella\b/gi, name: 'Satya Nadella' },
	{ pattern: /\bsundar\s*pichai\b|\bpichai\b/gi, name: 'Sundar Pichai' },
	{ pattern: /\bwarren\s*buffett\b|\bbuffett\b/gi, name: 'Warren Buffett' },
	{ pattern: /\bjanet\s*yellen\b|\byellen\b/gi, name: 'Janet Yellen' },
	{ pattern: /\bjerome\s*powell\b|\bpowell\b/gi, name: 'Jerome Powell' },
	{ pattern: /\bkamala\s*harris\b|\bharris\b/gi, name: 'Kamala Harris' },
	{ pattern: /\bnancy\s*pelosi\b|\bpelosi\b/gi, name: 'Nancy Pelosi' },
	{ pattern: /\bjensen\s*huang\b|\bhuang\b/gi, name: 'Jensen Huang' },
	{ pattern: /\bdario\s*amodei\b|\bamodei\b/gi, name: 'Dario Amodei' }
];
