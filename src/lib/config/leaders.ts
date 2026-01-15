/**
 * World Leaders enrichment data
 * This provides biographical details, approval ratings, and public consensus
 * that supplements the live data from OpenSanctions API
 *
 * Key by normalized name (lowercase) for matching with API data
 */

import type { WorldLeader } from '$lib/types';

/**
 * Country code to flag emoji mapping
 */
export const COUNTRY_FLAGS: Record<string, string> = {
	us: '🇺🇸',
	cn: '🇨🇳',
	ru: '🇷🇺',
	gb: '🇬🇧',
	fr: '🇫🇷',
	de: '🇩🇪',
	it: '🇮🇹',
	il: '🇮🇱',
	sa: '🇸🇦',
	ir: '🇮🇷',
	in: '🇮🇳',
	kp: '🇰🇵',
	jp: '🇯🇵',
	tw: '🇹🇼',
	ua: '🇺🇦',
	ar: '🇦🇷',
	br: '🇧🇷',
	ca: '🇨🇦',
	kr: '🇰🇷',
	au: '🇦🇺',
	mx: '🇲🇽',
	tr: '🇹🇷',
	pl: '🇵🇱',
	es: '🇪🇸',
	nl: '🇳🇱',
	be: '🇧🇪',
	se: '🇸🇪',
	no: '🇳🇴',
	dk: '🇩🇰',
	fi: '🇫🇮',
	ch: '🇨🇭',
	at: '🇦🇹',
	pt: '🇵🇹',
	gr: '🇬🇷',
	cz: '🇨🇿',
	hu: '🇭🇺',
	ro: '🇷🇴',
	za: '🇿🇦',
	eg: '🇪🇬',
	ng: '🇳🇬',
	ke: '🇰🇪',
	pk: '🇵🇰',
	bd: '🇧🇩',
	id: '🇮🇩',
	my: '🇲🇾',
	sg: '🇸🇬',
	th: '🇹🇭',
	vn: '🇻🇳',
	ph: '🇵🇭',
	nz: '🇳🇿',
	ie: '🇮🇪',
	cl: '🇨🇱',
	co: '🇨🇴',
	pe: '🇵🇪',
	ve: '🇻🇪'
};

/**
 * Country code to full name mapping
 */
export const COUNTRY_NAMES: Record<string, string> = {
	us: 'United States',
	cn: 'China',
	ru: 'Russia',
	gb: 'United Kingdom',
	fr: 'France',
	de: 'Germany',
	it: 'Italy',
	il: 'Israel',
	sa: 'Saudi Arabia',
	ir: 'Iran',
	in: 'India',
	kp: 'North Korea',
	jp: 'Japan',
	tw: 'Taiwan',
	ua: 'Ukraine',
	ar: 'Argentina',
	br: 'Brazil',
	ca: 'Canada',
	kr: 'South Korea',
	au: 'Australia',
	mx: 'Mexico',
	tr: 'Turkey',
	pl: 'Poland',
	es: 'Spain',
	nl: 'Netherlands',
	be: 'Belgium',
	se: 'Sweden',
	no: 'Norway',
	dk: 'Denmark',
	fi: 'Finland',
	ch: 'Switzerland',
	at: 'Austria',
	pt: 'Portugal',
	gr: 'Greece',
	cz: 'Czechia',
	hu: 'Hungary',
	ro: 'Romania',
	za: 'South Africa',
	eg: 'Egypt',
	ng: 'Nigeria',
	ke: 'Kenya',
	pk: 'Pakistan',
	bd: 'Bangladesh',
	id: 'Indonesia',
	my: 'Malaysia',
	sg: 'Singapore',
	th: 'Thailand',
	vn: 'Vietnam',
	ph: 'Philippines',
	nz: 'New Zealand',
	ie: 'Ireland',
	cl: 'Chile',
	co: 'Colombia',
	pe: 'Peru',
	ve: 'Venezuela'
};

/**
 * Priority positions to show (filter out ambassadors, ministers, etc.)
 * These are the positions we want to display prominently
 */
export const PRIORITY_POSITIONS = [
	'president',
	'prime minister',
	'chancellor',
	'supreme leader',
	'chairman',
	'king',
	'queen',
	'crown prince',
	'premier',
	'chief executive',
	'vice president'
];

/**
 * Countries we want to track leaders for
 */
export const TRACKED_COUNTRIES = [
	'us', // United States
	'cn', // China
	'ru', // Russia
	'gb', // United Kingdom
	'fr', // France
	'de', // Germany
	'it', // Italy
	'il', // Israel
	'sa', // Saudi Arabia
	'ir', // Iran
	'in', // India
	'kp', // North Korea
	'jp', // Japan
	'tw', // Taiwan
	'ua', // Ukraine
	'ar', // Argentina
	'br', // Brazil
	'ca', // Canada
	'kr' // South Korea
];

/**
 * Enrichment data for world leaders
 * Keyed by lowercase name for matching
 */
type LeaderEnrichment = Omit<WorldLeader, 'id' | 'name' | 'title' | 'country' | 'flag'>;

export const LEADER_ENRICHMENTS: Record<string, LeaderEnrichment> = {
	'donald trump': {
		keywords: ['trump', 'potus', 'white house'],
		since: 'Jan 2025',
		termEnds: 'Jan 2029',
		party: 'Republican',
		focus: ['tariffs', 'immigration', 'deregulation'],
		bio: {
			birthYear: 1946,
			birthPlace: 'Queens, New York, USA',
			education: 'Wharton School of Business, University of Pennsylvania',
			previousRoles: [
				'45th U.S. President (2017-2021)',
				'Chairman of The Trump Organization',
				'Host of The Apprentice'
			],
			background:
				'Real estate developer and businessman who entered politics in 2015. Served as 45th President from 2017-2021 before returning to office in 2025. Won both the popular vote and Electoral College in November 2024. His second term has focused on aggressive tariff policies, mass deportations, and federal government restructuring through the Department of Government Efficiency (DOGE).'
		},
		publicConsensus: {
			approval: {
				approval: 42,
				disapproval: 55,
				lastUpdated: 'Jan 2026',
				source: 'Gallup/538 Aggregate',
				trend: 'falling'
			},
			sentiment: 'mixed',
			summary:
				'Trump began his second term with approval ratings above 50%, but support has declined significantly. His approval has dropped to the mid-30s to low-40s depending on the poll, driven by economic concerns, the longest government shutdown in history, and controversial policy decisions. Strong support remains among Republicans (~89%) but independents have soured.',
			controversies: [
				'Record-long government shutdown over budget disputes',
				'Mass deportation operations drawing legal challenges',
				'Tariff policies causing economic uncertainty',
				'DOGE cuts to federal workforce'
			],
			achievements: [
				'Won popular vote in 2024 election',
				'Secured Republican trifecta in Congress',
				'Implemented major deregulation initiatives'
			]
		}
	},
	'jd vance': {
		keywords: ['jd vance', 'vice president vance'],
		since: 'Jan 2025',
		termEnds: 'Jan 2029',
		party: 'Republican',
		focus: ['tech policy', 'populism', 'foreign policy'],
		bio: {
			birthYear: 1984,
			birthPlace: 'Middletown, Ohio, USA',
			education: 'Yale Law School; Ohio State University',
			previousRoles: ['U.S. Senator from Ohio (2023-2025)', 'Venture Capitalist', 'Author'],
			background:
				'Author of the bestselling memoir "Hillbilly Elegy" about his upbringing in working-class Appalachia. Served in the U.S. Marine Corps during the Iraq War, later attended Yale Law School and worked in venture capital in Silicon Valley. Once a Trump critic, he became a strong ally and was selected as running mate in 2024. At 40, he is one of the youngest Vice Presidents in U.S. history.'
		},
		publicConsensus: {
			sentiment: 'mixed',
			summary:
				'Vance has emerged as a prominent voice for populist conservatism and "new right" ideology. He is seen as a potential future presidential candidate. His transformation from Trump critic to loyal ally has drawn both praise for pragmatism and criticism for opportunism. His book remains influential in understanding rural American discontent.',
			controversies: [
				'Past critical comments about Trump resurfaced during campaign',
				'"Childless cat ladies" comments drew widespread criticism',
				'Close ties to tech billionaires like Peter Thiel'
			],
			achievements: [
				'Youngest VP in decades, representing generational shift',
				'Bestselling author bringing attention to Appalachian poverty',
				'Influential voice on tech regulation and foreign policy'
			]
		}
	},
	'xi jinping': {
		keywords: ['xi jinping', 'xi', 'chinese president'],
		since: 'Mar 2013',
		party: 'CCP',
		focus: ['taiwan', 'belt and road', 'tech dominance'],
		bio: {
			birthYear: 1953,
			birthPlace: 'Beijing, China',
			education: 'Tsinghua University (Chemical Engineering, Law)',
			previousRoles: [
				'Vice President of China (2008-2013)',
				'Governor of Fujian',
				'Party Secretary of Zhejiang and Shanghai'
			],
			background:
				'The most powerful Chinese leader since Mao Zedong. Rose through provincial leadership positions before becoming General Secretary of the Communist Party in 2012. In 2018, he abolished presidential term limits, allowing him to potentially rule for life. He has centralized power, eliminated rivals through anti-corruption campaigns, and pursued an assertive foreign policy including militarization of the South China Sea.'
		},
		publicConsensus: {
			sentiment: 'mixed',
			summary:
				'Domestically, Xi maintains firm control with limited public dissent tolerated. Internationally, he is viewed with increasing concern by Western democracies due to human rights issues, Taiwan tensions, and economic coercion. However, he remains popular in the Global South and among countries in the Belt and Road Initiative. His "wolf warrior" diplomacy has strained relations with many Western nations.',
			controversies: [
				'Uyghur detention camps in Xinjiang drawing genocide accusations',
				'Crackdown on Hong Kong democracy movement',
				'Military pressure on Taiwan and disputed territories',
				'Zero-COVID policy caused significant economic damage',
				'Suppression of tech sector and private enterprise'
			],
			achievements: [
				'Lifted hundreds of millions out of poverty',
				'Made China a global technological competitor',
				'Expanded Chinese influence through Belt and Road Initiative',
				'Modernized Chinese military significantly'
			]
		}
	},
	'vladimir putin': {
		keywords: ['putin', 'kremlin', 'russian president'],
		since: 'May 2012',
		termEnds: 'May 2030',
		party: 'United Russia',
		focus: ['ukraine war', 'nato expansion', 'energy'],
		bio: {
			birthYear: 1952,
			birthPlace: 'Leningrad (now St. Petersburg), Russia',
			education: 'Leningrad State University (Law)',
			previousRoles: [
				'Prime Minister of Russia (1999, 2008-2012)',
				'President (2000-2008)',
				'Director of FSB',
				'KGB Officer'
			],
			background:
				"Former KGB intelligence officer who has dominated Russian politics for over two decades. After serving as President (2000-2008) and Prime Minister (2008-2012), he returned to the presidency. In 2020, constitutional changes allowed him to potentially remain in power until 2036. He launched the full-scale invasion of Ukraine in February 2022, the largest military conflict in Europe since World War II."
		},
		publicConsensus: {
			approval: {
				approval: 78,
				disapproval: 15,
				lastUpdated: 'Jan 2026',
				source: 'Levada Center',
				trend: 'stable'
			},
			sentiment: 'very negative',
			summary:
				'Domestically, Putin maintains high approval ratings (~78%) though independent polling is limited and dissent is criminalized. Internationally, he is widely condemned in the West as a war criminal and authoritarian. The ICC has issued an arrest warrant for him. Russia has become increasingly isolated from Western economies and institutions, though maintains ties with China, India, and other nations refusing to condemn the Ukraine invasion.',
			controversies: [
				'Full-scale invasion of Ukraine causing massive casualties',
				'ICC arrest warrant for alleged war crimes (deportation of children)',
				'Poisoning of opposition figures (Navalny, Skripal)',
				'Election interference in Western democracies',
				'Suppression of independent media and political opposition',
				'Annexation of Crimea (2014) and Ukrainian territories'
			],
			achievements: [
				'Restored Russian influence on world stage after 1990s collapse',
				'Modernized Russian military capabilities',
				'Maintained domestic political stability for two decades'
			]
		}
	},
	'keir starmer': {
		keywords: ['starmer', 'uk pm', 'british prime minister'],
		since: 'Jul 2024',
		termEnds: 'Jul 2029',
		party: 'Labour',
		focus: ['economy', 'NHS reform', 'housing'],
		bio: {
			birthYear: 1962,
			birthPlace: 'London, England',
			education: 'Oxford University (Law); Leeds University',
			previousRoles: [
				'Leader of the Opposition (2020-2024)',
				'Director of Public Prosecutions (2008-2013)',
				'Human Rights Adviser'
			],
			background:
				'Former barrister and Director of Public Prosecutions who was knighted in 2014 for services to law and criminal justice. Led Labour to a landslide victory in 2024, ending 14 years of Conservative rule. Known for his methodical, forensic approach to politics and his transformation of Labour from the Corbyn era.'
		},
		publicConsensus: {
			approval: {
				approval: 24,
				disapproval: 60,
				lastUpdated: 'Jan 2026',
				source: 'Morning Consult',
				trend: 'falling'
			},
			sentiment: 'negative',
			summary:
				'Starmer won a historic landslide but has seen rapid decline in popularity. Critics from the left accuse him of abandoning progressive policies, while others cite a perceived lack of charisma and vision. His government has struggled with economic challenges inherited from the Conservatives, and controversies over accepting gifts from donors have damaged his image. He remains one of the least popular leaders in Europe despite his recent victory.',
			controversies: [
				'Accepting expensive gifts and hospitality from donors',
				'Perceived abandonment of left-wing policies',
				'Criticism for cautious, managerial style lacking vision',
				'Handling of winter fuel payment cuts for pensioners'
			],
			achievements: [
				'Led Labour to largest majority since 1997',
				'Ended 14 years of Conservative government',
				'Reformed Labour Party and restored electability'
			]
		}
	},
	'emmanuel macron': {
		keywords: ['macron', 'french president', 'elysee'],
		since: 'May 2017',
		termEnds: 'May 2027',
		party: 'Renaissance',
		focus: ['EU leadership', 'pension reform', 'defense'],
		bio: {
			birthYear: 1977,
			birthPlace: 'Amiens, France',
			education: 'Sciences Po; ENA; University of Paris-Nanterre (Philosophy)',
			previousRoles: [
				'Minister of Economy (2014-2016)',
				'Deputy Secretary-General to the President',
				'Investment Banker at Rothschild'
			],
			background:
				'Former civil servant and investment banker who founded the centrist political movement En Marche! in 2016. Became the youngest President in French history at age 39. Re-elected in 2022 but lost his parliamentary majority. His decision to call snap elections in 2024 backfired, leaving him a weakened "lame duck" president.'
		},
		publicConsensus: {
			approval: {
				approval: 15,
				disapproval: 78,
				lastUpdated: 'Jan 2026',
				source: 'Morning Consult',
				trend: 'falling'
			},
			sentiment: 'very negative',
			summary:
				'Macron is the least popular leader among major democracies tracked. His approval collapsed after calling snap elections in 2024 that empowered both far-right and far-left parties. Three-quarters of French citizens disapprove of his leadership. He is seen as arrogant and out of touch by critics, though supporters credit him with pro-business reforms and EU leadership. He cannot run again in 2027 due to term limits.',
			controversies: [
				'Disastrous snap election gamble in 2024',
				'Forcing through pension reform without parliament vote',
				'Yellow vest protests against fuel taxes and inequality',
				'Perceived elitism and "president of the rich" image'
			],
			achievements: [
				'Youngest French president in history',
				'Led EU response to Ukraine crisis',
				'Economic reforms improved French competitiveness',
				'Successfully hosted 2024 Paris Olympics'
			]
		}
	},
	'olaf scholz': {
		keywords: ['scholz', 'german chancellor', 'berlin'],
		since: 'Dec 2021',
		termEnds: 'Feb 2025',
		party: 'SPD',
		focus: ['ukraine support', 'energy transition', 'economy'],
		bio: {
			birthYear: 1958,
			birthPlace: 'Osnabrück, Germany',
			education: 'University of Hamburg (Law)',
			previousRoles: [
				'Vice Chancellor and Finance Minister (2018-2021)',
				'First Mayor of Hamburg (2011-2018)',
				'Minister of Labour'
			],
			background:
				'Long-serving SPD politician who led a three-party "traffic light" coalition (SPD, Greens, FDP). His government collapsed in late 2024 after firing Finance Minister Christian Lindner. He faces snap elections in February 2025 and is expected to be replaced by CDU leader Friedrich Merz.'
		},
		publicConsensus: {
			approval: {
				approval: 20,
				disapproval: 72,
				lastUpdated: 'Jan 2026',
				source: 'Forsa/Morning Consult',
				trend: 'falling'
			},
			sentiment: 'negative',
			summary:
				'Scholz led Germany through the energy crisis triggered by the Ukraine war but his coalition collapsed due to internal disputes. He is criticized for being indecisive, slow to act, and poor at communicating. His "Zeitenwende" (turning point) speech promising defense spending was not fully delivered. The German economy has struggled under his leadership with recession concerns.',
			controversies: [
				'Coalition collapse after firing Finance Minister',
				'Slow, hesitant response to Ukraine crisis initially',
				'Economic stagnation and deindustrialization concerns',
				'Cum-ex tax scandal investigation from Hamburg days'
			],
			achievements: [
				'Navigated energy crisis after Russian gas cutoff',
				'Maintained German support for Ukraine',
				'Historic defense spending increase commitment'
			]
		}
	},
	'giorgia meloni': {
		keywords: ['meloni', 'italian pm', 'italy prime minister'],
		since: 'Oct 2022',
		party: 'Brothers of Italy',
		focus: ['immigration', 'EU relations', 'economy'],
		bio: {
			birthYear: 1977,
			birthPlace: 'Rome, Italy',
			education: 'Amerigo Vespucci Language High School',
			previousRoles: [
				'Minister of Youth (2008-2011)',
				'Member of Chamber of Deputies',
				'Leader of Brothers of Italy (since 2014)'
			],
			background:
				"Italy's first female Prime Minister and leader of the right-wing Brothers of Italy party, which has roots in post-fascist movements. Despite initial fears, she has maintained EU and NATO alignment while pursuing conservative domestic policies, particularly on immigration."
		},
		publicConsensus: {
			approval: {
				approval: 43,
				disapproval: 50,
				lastUpdated: 'Jan 2026',
				source: 'Morning Consult',
				trend: 'stable'
			},
			sentiment: 'mixed',
			summary:
				"Meloni has defied expectations by governing more pragmatically than her far-right rhetoric suggested. She has maintained strong EU and NATO ties while being hawkish on immigration. Domestically, she remains popular with her base, though critics worry about democratic backsliding and ties to her party's post-fascist origins. She has become an influential figure in European conservative politics.",
			controversies: [
				"Brothers of Italy party's neo-fascist roots",
				'Controversial Albania migrant processing deal',
				'Criticism from LGBTQ+ groups over family policies',
				'Libel lawsuits against journalists and critics'
			],
			achievements: [
				'First female Prime Minister of Italy',
				'Maintained government stability (rare for Italy)',
				'Strong EU and NATO partner despite far-right label',
				'Reduced irregular migration through controversial deals'
			]
		}
	},
	'benjamin netanyahu': {
		keywords: ['netanyahu', 'bibi', 'israeli pm'],
		since: 'Dec 2022',
		party: 'Likud',
		focus: ['gaza', 'iran', 'judicial reform'],
		bio: {
			birthYear: 1949,
			birthPlace: 'Tel Aviv, Israel',
			education: 'MIT (Architecture, Business Administration)',
			previousRoles: [
				'Prime Minister (1996-1999, 2009-2021)',
				'Finance Minister',
				'Foreign Minister',
				'IDF Special Forces'
			],
			background:
				'Israel\'s longest-serving Prime Minister, known as "Bibi." Served in the elite Sayeret Matkal unit and lost his brother Yonatan in the famous Entebbe raid. A polarizing figure who has dominated Israeli politics for decades. Currently leading Israel through its war in Gaza following the October 7, 2023 Hamas attacks.'
		},
		publicConsensus: {
			sentiment: 'very negative',
			summary:
				'Netanyahu is one of the most polarizing leaders globally. Domestically, he faces massive protests over judicial reform and is on trial for corruption. The October 7 security failure has been blamed on his government. Internationally, he faces criticism over Gaza civilian casualties and an ICC arrest warrant. However, his supporters see him as essential for Israeli security against Iran and Hamas.',
			controversies: [
				'ICC arrest warrant for alleged war crimes in Gaza',
				'Ongoing corruption trial (bribery, fraud, breach of trust)',
				'Judicial overhaul sparked massive domestic protests',
				'Intelligence failures leading to October 7 attacks',
				'Gaza war civilian casualty toll drawing international condemnation',
				'Tensions with Biden administration over war conduct'
			],
			achievements: [
				'Abraham Accords normalizing ties with Arab states',
				"Israel's longest-serving Prime Minister",
				'Economic growth and tech sector development',
				'Strong stance against Iranian nuclear program'
			]
		}
	},
	'mohammed bin salman': {
		keywords: ['mbs', 'saudi crown prince', 'bin salman'],
		since: 'Jun 2017',
		party: 'Royal Family',
		focus: ['vision 2030', 'oil', 'regional influence'],
		bio: {
			birthYear: 1985,
			birthPlace: 'Riyadh, Saudi Arabia',
			education: 'King Saud University (Law)',
			previousRoles: [
				'Minister of Defense (2015-present)',
				'Chairman of Council for Economic and Development Affairs',
				'Various royal advisory roles'
			],
			background:
				'The de facto ruler of Saudi Arabia as Crown Prince and Prime Minister. Known as "MBS," he has pursued ambitious modernization through Vision 2030 while maintaining authoritarian control. He has allowed women to drive, opened entertainment venues, but crushed dissent. He is preparing Saudi Arabia for a post-oil economy while remaining a key player in global energy markets.'
		},
		publicConsensus: {
			sentiment: 'mixed',
			summary:
				'MBS is seen as a complex figure: a modernizer bringing social reforms to a conservative kingdom, but also an authoritarian accused of brutal repression. The Khashoggi murder severely damaged his international reputation. Western governments maintain pragmatic ties due to Saudi oil influence. He has pursued ambitious mega-projects (NEOM, The Line) while cracking down on any opposition.',
			controversies: [
				'Assassination of journalist Jamal Khashoggi in Istanbul consulate',
				'Mass detention of activists, royals in Ritz-Carlton crackdown',
				'Yemen war causing humanitarian catastrophe',
				'Execution rates have increased dramatically',
				'Human rights activists imprisoned and tortured'
			],
			achievements: [
				'Vision 2030 economic diversification program',
				'Social reforms: women driving, entertainment, tourism',
				'Regional diplomacy including China-brokered Iran deal',
				'Massive sovereign wealth fund investments globally'
			]
		}
	},
	'ali khamenei': {
		keywords: ['khamenei', 'supreme leader', 'ayatollah'],
		since: 'Jun 1989',
		party: 'Islamic Republic',
		focus: ['nuclear program', 'proxies', 'sanctions'],
		bio: {
			birthYear: 1939,
			birthPlace: 'Mashhad, Iran',
			education: 'Islamic seminaries in Qom and Najaf',
			previousRoles: [
				'President of Iran (1981-1989)',
				'Minister of Defense',
				'Revolutionary leader and cleric'
			],
			background:
				"Shia cleric who became Supreme Leader after the death of Ayatollah Khomeini. Holds highest authority in Iran's political and religious system. Has served in the role for over three decades, maintaining Iran's theocratic system through periods of reform and hardline rule."
		},
		publicConsensus: {
			sentiment: 'very negative',
			summary:
				"Iran's Supreme Leader for over 35 years, Khamenei holds ultimate authority over all branches of government. Internationally condemned for supporting proxy militias across the Middle East, pursuing nuclear weapons capability, and brutal suppression of domestic protests. The 2022 Woman, Life, Freedom protests saw massive crackdowns under his authority.",
			controversies: [
				'Brutal suppression of 2022 Woman, Life, Freedom protests',
				'Nuclear weapons program concerns',
				'Support for Hamas, Hezbollah, Houthis, and other proxies',
				'Execution of thousands of political prisoners',
				'Internet shutdowns and media censorship'
			],
			achievements: [
				'Maintained regime stability for over 35 years',
				'Built extensive regional proxy network',
				'Advanced ballistic missile program'
			]
		}
	},
	'narendra modi': {
		keywords: ['modi', 'indian pm', 'india prime minister'],
		since: 'May 2014',
		party: 'BJP',
		focus: ['economy', 'china border', 'technology'],
		bio: {
			birthYear: 1950,
			birthPlace: 'Vadnagar, Gujarat, India',
			education: 'Gujarat University (Political Science); Delhi University (MA)',
			previousRoles: [
				'Chief Minister of Gujarat (2001-2014)',
				'BJP General Secretary',
				'RSS Organizer'
			],
			background:
				'Rose through the ranks of the RSS and BJP organizations. Served as Chief Minister of Gujarat for over 12 years before becoming Prime Minister. Currently serving third consecutive term after victories in 2014, 2019, and 2024. Has pursued Hindu nationalist agenda while promoting economic development.'
		},
		publicConsensus: {
			approval: {
				approval: 68,
				disapproval: 28,
				lastUpdated: 'Jan 2026',
				source: 'Morning Consult',
				trend: 'stable'
			},
			sentiment: 'mixed',
			summary:
				"Modi remains one of the world's most popular democratically elected leaders. Supporters credit him with economic growth, infrastructure development, and raising India's global profile. Critics accuse him of Hindu nationalism, democratic backsliding, and persecution of minorities. His government has been accused of using state apparatus against opposition figures.",
			controversies: [
				'Allegations of democratic backsliding and press freedom decline',
				'Citizenship Amendment Act protests and treatment of Muslims',
				'2002 Gujarat riots when he was Chief Minister',
				'Adani stock manipulation scandal and opposition crackdowns',
				'Kashmir autonomy revocation and communications blackout'
			],
			achievements: [
				'Three consecutive electoral victories',
				'Major infrastructure development (roads, railways, airports)',
				"Raised India's global diplomatic profile",
				'Digital India initiative and financial inclusion programs'
			]
		}
	},
	'kim jong un': {
		keywords: ['kim jong un', 'north korea', 'pyongyang'],
		since: 'Dec 2011',
		party: "Workers' Party",
		focus: ['nuclear', 'missiles', 'russia alliance'],
		bio: {
			birthYear: 1984,
			birthPlace: 'Pyongyang, North Korea',
			education: 'Kim Il Sung Military University; reportedly studied in Switzerland',
			previousRoles: ['Vice Chairman of Central Military Commission', 'Heir apparent under Kim Jong Il'],
			background:
				"Third generation leader of North Korea, succeeding his father Kim Jong Il in 2011. Holds multiple titles including General Secretary of the Workers' Party and Supreme Commander of the Armed Forces. Has dramatically accelerated North Korea's nuclear and missile programs."
		},
		publicConsensus: {
			sentiment: 'very negative',
			summary:
				"Kim Jong Un runs one of the world's most repressive regimes. North Korea has no free press, no elections, and maintains an extensive gulag system. Under his rule, nuclear and missile tests have accelerated. He has cultivated closer ties with Russia and China while facing severe international sanctions.",
			controversies: [
				'Execution of family members including uncle Jang Song-thaek',
				'Assassination of half-brother Kim Jong-nam with VX nerve agent',
				'Massive gulag system holding hundreds of thousands',
				'Nuclear and ICBM testing threatening regional stability',
				'Severe food insecurity while pursuing weapons programs'
			],
			achievements: [
				'Advanced nuclear weapons capability',
				'ICBM development capable of reaching US mainland',
				'Historic summits with Trump and Moon Jae-in',
				'Strengthened alliance with Russia and China'
			]
		}
	},
	'shigeru ishiba': {
		keywords: ['ishiba', 'japanese pm', 'japan prime minister'],
		since: 'Oct 2024',
		party: 'LDP',
		focus: ['defense', 'china', 'us alliance'],
		bio: {
			birthYear: 1957,
			birthPlace: 'Tottori Prefecture, Japan',
			education: 'Keio University (Law)',
			previousRoles: ['Minister of Defense (twice)', 'Minister of Agriculture', 'LDP Secretary-General'],
			background:
				'Long-serving LDP politician known for expertise in defense and security policy. Made multiple bids for LDP leadership before succeeding in 2024. Known for his detailed policy knowledge and independent stance within the party.'
		},
		publicConsensus: {
			approval: {
				approval: 34,
				disapproval: 46,
				lastUpdated: 'Jan 2026',
				source: 'NHK/Japanese polls',
				trend: 'falling'
			},
			sentiment: 'mixed',
			summary:
				'Ishiba became PM after years of trying but faces challenges with a weak electoral mandate. Known as a defense hawk who has proposed an Asian NATO-style alliance. His government lost its parliamentary majority in the 2024 election, forcing him to govern as a minority. Respected for policy expertise but seen as lacking political charisma.',
			controversies: [
				'Lost parliamentary majority shortly after taking office',
				'Proposals for Asian NATO seen as provocative by China',
				'Political fundraising scandal within LDP',
				'Tensions with party factions who opposed his leadership'
			],
			achievements: [
				'Finally achieved LDP leadership after multiple attempts',
				'Strong defense policy credentials',
				'Maintained US-Japan alliance strength'
			]
		}
	},
	'lai ching-te': {
		keywords: ['lai ching-te', 'taiwan president', 'taipei', 'william lai'],
		since: 'May 2024',
		party: 'DPP',
		focus: ['china relations', 'defense', 'semiconductors'],
		bio: {
			birthYear: 1959,
			birthPlace: 'New Taipei City, Taiwan',
			education: 'Harvard University (Public Health); National Cheng Kung University (Medicine)',
			previousRoles: [
				'Vice President (2020-2024)',
				'Premier (2017-2019)',
				'Mayor of Tainan',
				'Legislator'
			],
			background:
				'Physician who transitioned to politics, serving as legislator and mayor before national roles. Succeeded Tsai Ing-wen as DPP candidate and won the 2024 presidential election despite Chinese pressure.'
		},
		publicConsensus: {
			sentiment: 'mixed',
			summary:
				"Lai represents continuity with Tsai Ing-wen's policies of maintaining Taiwan's de facto independence while avoiding provocation of China. Beijing considers him a 'separatist' and has increased military pressure since his election. He faces the challenge of maintaining US support while managing cross-strait tensions. Domestically popular but constrained by lacking legislative majority.",
			controversies: [
				'Beijing labels him a "dangerous separatist"',
				'Governing without legislative majority (hung parliament)',
				'Balance between US and China relations',
				'Housing affordability and economic inequality concerns'
			],
			achievements: [
				'Won presidency despite unprecedented Chinese interference',
				'Maintained strong US-Taiwan relations',
				'Continued strengthening Taiwan defense capabilities'
			]
		}
	},
	'volodymyr zelensky': {
		keywords: ['zelensky', 'ukraine president', 'kyiv', 'zelenskyy'],
		since: 'May 2019',
		party: 'Servant of the People',
		focus: ['war', 'western aid', 'nato membership'],
		bio: {
			birthYear: 1978,
			birthPlace: 'Kryvyi Rih, Ukraine',
			education: 'Kyiv National Economic University (Law)',
			previousRoles: ['Actor and Comedian', 'Producer at Kvartal 95', 'Voice Actor'],
			background:
				'Entertainer and producer who starred in the TV series "Servant of the People" playing a teacher who becomes president. Founded the political party of the same name and won the 2019 presidential election. Has led Ukraine since Russia\'s full-scale invasion in 2022, becoming a symbol of Ukrainian resistance.'
		},
		publicConsensus: {
			approval: {
				approval: 57,
				disapproval: 38,
				lastUpdated: 'Jan 2026',
				source: 'KIIS Ukraine',
				trend: 'falling'
			},
			sentiment: 'positive',
			summary:
				'Zelensky transformed from comedian to wartime leader, becoming an international symbol of resistance against Russian aggression. His decision to stay in Kyiv during the invasion ("I need ammunition, not a ride") galvanized Ukrainian resistance and Western support. Domestically, approval has declined from wartime highs due to war fatigue and mobilization concerns. Internationally, he remains highly regarded in Western democracies.',
			controversies: [
				'Martial law and postponement of elections during wartime',
				'Mobilization policies and age limit debates',
				'Pre-war corruption concerns (though fighting has reduced this)',
				'Tensions with some Western allies over pace of support'
			],
			achievements: [
				'Rallied Ukraine and West against Russian invasion',
				'Secured unprecedented Western military and financial aid',
				'Maintained Ukrainian sovereignty against larger adversary',
				'EU membership candidate status achieved'
			]
		}
	},
	'javier milei': {
		keywords: ['milei', 'argentina president', 'buenos aires'],
		since: 'Dec 2023',
		party: 'La Libertad Avanza',
		focus: ['dollarization', 'spending cuts', 'deregulation'],
		bio: {
			birthYear: 1970,
			birthPlace: 'Buenos Aires, Argentina',
			education: 'University of Belgrano (Economics); ESEADE (Economics)',
			previousRoles: [
				'National Deputy (2021-2023)',
				'Economist',
				'Television Commentator',
				'University Professor'
			],
			background:
				'Economist who gained prominence as a media commentator known for libertarian views and theatrical style. Elected to Congress in 2021 and won the presidency in 2023 on a platform of radical economic reform and reducing government size. Known for his signature chainsaw prop and rock star-like rallies.'
		},
		publicConsensus: {
			approval: {
				approval: 47,
				disapproval: 48,
				lastUpdated: 'Jan 2026',
				source: 'Morning Consult',
				trend: 'stable'
			},
			sentiment: 'mixed',
			summary:
				'Milei has implemented aggressive austerity measures including massive spending cuts and deregulation. Inflation has begun to fall but recession and poverty have worsened. He is polarizing - supporters see him as necessary shock therapy for Argentina, critics see reckless destruction of social programs. His unconventional style and social media presence have made him a global libertarian icon.',
			controversies: [
				'Deep austerity causing recession and poverty spike',
				'Abolition of ministries and mass public sector layoffs',
				'Inflammatory rhetoric and insults toward critics',
				'Close alignment with Trump and Musk'
			],
			achievements: [
				'Reduced inflation from 25% monthly to single digits',
				'Achieved fiscal surplus for first time in years',
				'Major deregulation of economy',
				'Currency stabilization progress'
			]
		}
	},
	'luiz inacio lula da silva': {
		keywords: ['lula', 'brazil president', 'brasilia', 'lula da silva'],
		since: 'Jan 2023',
		party: 'PT',
		focus: ['amazon', 'social programs', 'brics'],
		bio: {
			birthYear: 1945,
			birthPlace: 'Garanhuns, Pernambuco, Brazil',
			education: 'Limited formal education; metalworker training',
			previousRoles: ['President of Brazil (2003-2010)', 'Union Leader', 'Founding Member of PT'],
			background:
				"Former metalworker and union leader who co-founded the Workers' Party (PT). Served as President from 2003-2010, overseeing economic growth and social programs that lifted millions from poverty. Convicted of corruption in 2017 and imprisoned until convictions were annulled. Returned to power in 2023 after defeating Bolsonaro."
		},
		publicConsensus: {
			approval: {
				approval: 41,
				disapproval: 54,
				lastUpdated: 'Jan 2026',
				source: 'Morning Consult',
				trend: 'falling'
			},
			sentiment: 'mixed',
			summary:
				"Lula's third term has been marked by efforts to restore social programs and Amazon protections dismantled under Bolsonaro. However, economic challenges and political polarization have limited his effectiveness. He faces a hostile Congress and persistent distrust from Bolsonaro supporters. Internationally, he has sought to position Brazil as a neutral mediator while maintaining BRICS ties.",
			controversies: [
				'Prior corruption convictions (later annulled on procedural grounds)',
				'Controversial statements about Israel-Gaza conflict',
				'Failure to condemn Russian invasion of Ukraine',
				'Economic challenges and high interest rates'
			],
			achievements: [
				'Reduced Amazon deforestation from Bolsonaro-era highs',
				'Restored social programs and environmental protections',
				'Peacefully assumed power after January 8 riots',
				'Reasserted Brazilian diplomatic presence globally'
			]
		}
	},
	'mark carney': {
		keywords: ['carney', 'canadian pm', 'canada prime minister', 'ottawa'],
		since: 'Mar 2025',
		party: 'Liberal',
		focus: ['tariffs', 'us relations', 'economy'],
		bio: {
			birthYear: 1965,
			birthPlace: 'Fort Smith, Northwest Territories, Canada',
			education: 'Harvard University (Economics); Oxford University (Economics PhD)',
			previousRoles: [
				'Governor of Bank of England (2013-2020)',
				'Governor of Bank of Canada (2008-2013)',
				'Goldman Sachs Executive'
			],
			background:
				'Economist and former central banker who led both the Bank of Canada and Bank of England - the first person to head two major central banks. Navigated the 2008 financial crisis and Brexit. Entered politics after his banking career, becoming Liberal Party leader and Prime Minister as Canada faces trade tensions with the Trump administration.'
		},
		publicConsensus: {
			sentiment: 'mixed',
			summary:
				'Carney brings unprecedented economic credentials to the PM role as Canada faces existential trade threats from US tariffs. His lack of political experience is seen as both an asset (outsider credentials) and liability (untested in partisan combat). He must navigate the Trump administration while maintaining Canadian sovereignty and economic stability.',
			controversies: [
				'No elected political experience before becoming PM',
				'Connections to global financial elite and Goldman Sachs',
				'Climate advocacy while having worked in fossil fuel-dependent economies',
				'Inheriting Liberal party with depleted popularity'
			],
			achievements: [
				'Only person to lead two G7 central banks',
				'Successfully navigated 2008 financial crisis',
				'Led Bank of England through Brexit uncertainty',
				'UN climate finance envoy experience'
			]
		}
	},
	'yoon suk yeol': {
		keywords: ['yoon', 'south korea president', 'seoul'],
		since: 'May 2022',
		party: "People Power Party",
		focus: ['north korea', 'japan relations', 'economy'],
		bio: {
			birthYear: 1960,
			birthPlace: 'Seoul, South Korea',
			education: 'Seoul National University (Law)',
			previousRoles: [
				'Prosecutor General (2019-2021)',
				'Chief Prosecutor of Seoul Central District'
			],
			background:
				'Former prosecutor who rose to fame investigating corruption scandals including those involving former presidents. Elected president in 2022 on an anti-corruption platform. His brief declaration of martial law in December 2024 led to his impeachment.'
		},
		publicConsensus: {
			approval: {
				approval: 17,
				disapproval: 78,
				lastUpdated: 'Jan 2026',
				source: 'Gallup Korea',
				trend: 'falling'
			},
			sentiment: 'very negative',
			summary:
				"Yoon's presidency imploded after he briefly declared martial law in December 2024, citing 'anti-state forces.' The National Assembly voted to lift it within hours. He was impeached and is awaiting Constitutional Court ruling on removal. His approval ratings collapsed and he faces potential criminal charges. The incident shocked South Korean democracy.",
			controversies: [
				'Declared martial law in December 2024, immediately reversed by parliament',
				'Impeached by National Assembly',
				'First Lady corruption scandals and influence peddling',
				'Polarizing political style and poor approval ratings',
				'Damaged South Korean democratic reputation internationally'
			],
			achievements: [
				'Improved Japan-South Korea relations',
				'Strengthened US-Korea alliance',
				'Took harder line on North Korea'
			]
		}
	}
};

/**
 * Map leader names to their country codes for flag lookup
 */
const LEADER_COUNTRIES: Record<string, string> = {
	'donald trump': 'us',
	'jd vance': 'us',
	'xi jinping': 'cn',
	'vladimir putin': 'ru',
	'keir starmer': 'gb',
	'emmanuel macron': 'fr',
	'olaf scholz': 'de',
	'giorgia meloni': 'it',
	'benjamin netanyahu': 'il',
	'mohammed bin salman': 'sa',
	'ali khamenei': 'ir',
	'narendra modi': 'in',
	'kim jong un': 'kp',
	'shigeru ishiba': 'jp',
	'lai ching-te': 'tw',
	'volodymyr zelensky': 'ua',
	'javier milei': 'ar',
	'luiz inacio lula da silva': 'br',
	'mark carney': 'ca',
	'yoon suk yeol': 'kr'
};

/**
 * Legacy export for backward compatibility
 * This will be replaced by the dynamic store, but keeping it for components that haven't migrated
 */
export const WORLD_LEADERS: WorldLeader[] = Object.entries(LEADER_ENRICHMENTS).map(
	([name, data]) => {
		const countryCode = LEADER_COUNTRIES[name] || '';
		return {
			id: name.toLowerCase().replace(/\s+/g, '-'),
			name: name
				.split(' ')
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' '),
			title: '', // Will be filled from API
			country: COUNTRY_NAMES[countryCode] || '',
			flag: COUNTRY_FLAGS[countryCode] || '',
			...data
		};
	}
);
