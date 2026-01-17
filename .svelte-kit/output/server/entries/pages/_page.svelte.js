import { s as store_get, h as head, u as unsubscribe_stores } from "../../chunks/index2.js";
import "clsx";
import { w as writable, d as derived, g as get } from "../../chunks/index.js";
import { B as BROWSER } from "../../chunks/false.js";
import "@mlc-ai/web-llm";
const browser = BROWSER;
function createThemeStore() {
  const initialTheme = "dark";
  const { subscribe, set } = writable(initialTheme);
  return {
    subscribe,
    setTheme: (theme2) => {
      set(theme2);
    },
    toggle: () => {
      const newTheme = "light";
      set(newTheme);
    }
  };
}
createThemeStore();
const PANELS = {
  map: { name: "Global Situation", priority: 1 },
  politics: { name: "Politics", priority: 1 },
  tech: { name: "Tech", priority: 1 },
  finance: { name: "Finance", priority: 1 },
  gov: { name: "Government", priority: 2 },
  heatmap: { name: "Sector Heatmap", priority: 1 },
  markets: { name: "Markets", priority: 1 },
  polymarket: { name: "Polymarket", priority: 2 },
  printer: { name: "Money Printer", priority: 2 },
  contracts: { name: "Gov Contracts", priority: 3 },
  layoffs: { name: "Layoffs Tracker", priority: 3 },
  correlation: { name: "Pattern Analysis", priority: 1 },
  narrative: { name: "Global Sentiment", priority: 1 },
  fed: { name: "Federal Reserve", priority: 1 },
  "today-summary": { name: "Today Summarized", priority: 1 }
};
const NON_DRAGGABLE_PANELS = ["map"];
const ALERT_KEYWORDS = [
  "war",
  "invasion",
  "military",
  "nuclear",
  "sanctions",
  "missile",
  "attack",
  "troops",
  "conflict",
  "strike",
  "bomb",
  "casualties",
  "ceasefire",
  "treaty",
  "nato",
  "coup",
  "martial law",
  "emergency",
  "assassination",
  "terrorist",
  "hostage",
  "evacuation"
];
const REGION_KEYWORDS = {
  EUROPE: [
    "nato",
    "eu",
    "european",
    "ukraine",
    "russia",
    "germany",
    "france",
    "uk",
    "britain",
    "poland"
  ],
  MENA: [
    "iran",
    "israel",
    "saudi",
    "syria",
    "iraq",
    "gaza",
    "lebanon",
    "yemen",
    "houthi",
    "middle east"
  ],
  APAC: [
    "china",
    "taiwan",
    "japan",
    "korea",
    "indo-pacific",
    "south china sea",
    "asean",
    "philippines"
  ],
  AMERICAS: ["us", "america", "canada", "mexico", "brazil", "venezuela", "latin"],
  AFRICA: ["africa", "sahel", "niger", "sudan", "ethiopia", "somalia"]
};
const TOPIC_KEYWORDS = {
  CYBER: ["cyber", "hack", "ransomware", "malware", "breach", "apt", "vulnerability"],
  NUCLEAR: ["nuclear", "icbm", "warhead", "nonproliferation", "uranium", "plutonium"],
  CONFLICT: ["war", "military", "troops", "invasion", "strike", "missile", "combat", "offensive"],
  INTEL: ["intelligence", "espionage", "spy", "cia", "mossad", "fsb", "covert"],
  DEFENSE: ["pentagon", "dod", "defense", "military", "army", "navy", "air force"],
  DIPLO: ["diplomat", "embassy", "treaty", "sanctions", "talks", "summit", "bilateral"]
};
function containsAlertKeyword(text) {
  const lowerText = text.toLowerCase();
  for (const keyword of ALERT_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return { isAlert: true, keyword };
    }
  }
  return { isAlert: false };
}
function detectRegion(text) {
  const lowerText = text.toLowerCase();
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some((k) => lowerText.includes(k))) {
      return region;
    }
  }
  return null;
}
function detectTopics(text) {
  const lowerText = text.toLowerCase();
  const detected = [];
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((k) => lowerText.includes(k))) {
      detected.push(topic);
    }
  }
  return detected;
}
const SECTORS = [
  { symbol: "XLK", name: "Tech" },
  { symbol: "XLF", name: "Finance" },
  { symbol: "XLE", name: "Energy" }
];
const COMMODITIES = [
  { symbol: "^VIX", name: "VIX", display: "VIX" },
  { symbol: "GC=F", name: "Gold", display: "GOLD" },
  { symbol: "CL=F", name: "Crude Oil", display: "OIL" }
];
const INDICES = [
  { symbol: "^DJI", name: "Dow Jones", display: "DOW" },
  { symbol: "^GSPC", name: "S&P 500", display: "S&P" },
  { symbol: "^IXIC", name: "NASDAQ", display: "NDQ" }
];
const CRYPTO = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" }
];
const PRESETS = {
  "news-junkie": {
    id: "news-junkie",
    name: "News Junkie",
    icon: "📰",
    description: "Stay on top of breaking news across politics, tech, and finance",
    panels: ["today-summary", "politics", "tech", "finance", "gov", "map"]
  },
  trader: {
    id: "trader",
    name: "Trader",
    icon: "📈",
    description: "Market-focused dashboard with stocks, crypto, and commodities",
    panels: [
      "markets",
      "heatmap",
      "commodities",
      "crypto",
      "polymarket",
      "whales",
      "printer",
      "finance",
      "map"
    ]
  },
  geopolitics: {
    id: "geopolitics",
    name: "Geopolitics Watcher",
    icon: "🌍",
    description: "Global situation awareness and regional hotspots",
    panels: [
      "map",
      "today-summary",
      "politics",
      "gov",
      "venezuela",
      "greenland",
      "iran",
      "correlation",
      "narrative"
    ]
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    icon: "⚡",
    description: "Just the essentials - map, news, and markets",
    panels: ["map", "politics", "markets"]
  },
  everything: {
    id: "everything",
    name: "Everything",
    icon: "🎛️",
    description: "Kitchen sink - all panels enabled",
    panels: [
      "map",
      "today-summary",
      "politics",
      "tech",
      "finance",
      "gov",
      "heatmap",
      "markets",
      "commodities",
      "crypto",
      "polymarket",
      "whales",
      "printer",
      "contracts",
      "layoffs",
      "venezuela",
      "greenland",
      "iran",
      "correlation",
      "narrative"
    ]
  }
};
process.env.VITE_FINNHUB_API_KEY ?? "";
process.env.VITE_FRED_API_KEY ?? "";
const COUNTRY_FLAGS = {
  us: "🇺🇸",
  cn: "🇨🇳",
  ru: "🇷🇺",
  gb: "🇬🇧",
  fr: "🇫🇷",
  de: "🇩🇪",
  it: "🇮🇹",
  il: "🇮🇱",
  sa: "🇸🇦",
  ir: "🇮🇷",
  in: "🇮🇳",
  kp: "🇰🇵",
  jp: "🇯🇵",
  tw: "🇹🇼",
  ua: "🇺🇦",
  ar: "🇦🇷",
  br: "🇧🇷",
  ca: "🇨🇦",
  kr: "🇰🇷",
  au: "🇦🇺",
  mx: "🇲🇽",
  tr: "🇹🇷",
  pl: "🇵🇱",
  es: "🇪🇸",
  nl: "🇳🇱",
  be: "🇧🇪",
  se: "🇸🇪",
  no: "🇳🇴",
  dk: "🇩🇰",
  fi: "🇫🇮",
  ch: "🇨🇭",
  at: "🇦🇹",
  pt: "🇵🇹",
  gr: "🇬🇷",
  cz: "🇨🇿",
  hu: "🇭🇺",
  ro: "🇷🇴",
  za: "🇿🇦",
  eg: "🇪🇬",
  ng: "🇳🇬",
  ke: "🇰🇪",
  pk: "🇵🇰",
  bd: "🇧🇩",
  id: "🇮🇩",
  my: "🇲🇾",
  sg: "🇸🇬",
  th: "🇹🇭",
  vn: "🇻🇳",
  ph: "🇵🇭",
  nz: "🇳🇿",
  ie: "🇮🇪",
  cl: "🇨🇱",
  co: "🇨🇴",
  pe: "🇵🇪",
  ve: "🇻🇪"
};
const COUNTRY_NAMES = {
  us: "United States",
  cn: "China",
  ru: "Russia",
  gb: "United Kingdom",
  fr: "France",
  de: "Germany",
  it: "Italy",
  il: "Israel",
  sa: "Saudi Arabia",
  ir: "Iran",
  in: "India",
  kp: "North Korea",
  jp: "Japan",
  tw: "Taiwan",
  ua: "Ukraine",
  ar: "Argentina",
  br: "Brazil",
  ca: "Canada",
  kr: "South Korea",
  au: "Australia",
  mx: "Mexico",
  tr: "Turkey",
  pl: "Poland",
  es: "Spain",
  nl: "Netherlands",
  be: "Belgium",
  se: "Sweden",
  no: "Norway",
  dk: "Denmark",
  fi: "Finland",
  ch: "Switzerland",
  at: "Austria",
  pt: "Portugal",
  gr: "Greece",
  cz: "Czechia",
  hu: "Hungary",
  ro: "Romania",
  za: "South Africa",
  eg: "Egypt",
  ng: "Nigeria",
  ke: "Kenya",
  pk: "Pakistan",
  bd: "Bangladesh",
  id: "Indonesia",
  my: "Malaysia",
  sg: "Singapore",
  th: "Thailand",
  vn: "Vietnam",
  ph: "Philippines",
  nz: "New Zealand",
  ie: "Ireland",
  cl: "Chile",
  co: "Colombia",
  pe: "Peru",
  ve: "Venezuela"
};
const LEADER_ENRICHMENTS = {
  "donald trump": {
    keywords: ["trump", "potus", "white house"],
    since: "Jan 2025",
    termEnds: "Jan 2029",
    party: "Republican",
    focus: ["tariffs", "immigration", "deregulation"],
    bio: {
      birthYear: 1946,
      birthPlace: "Queens, New York, USA",
      education: "Wharton School of Business, University of Pennsylvania",
      previousRoles: [
        "45th U.S. President (2017-2021)",
        "Chairman of The Trump Organization",
        "Host of The Apprentice"
      ],
      background: "Real estate developer and businessman who entered politics in 2015. Served as 45th President from 2017-2021 before returning to office in 2025. Won both the popular vote and Electoral College in November 2024. His second term has focused on aggressive tariff policies, mass deportations, and federal government restructuring through the Department of Government Efficiency (DOGE)."
    },
    publicConsensus: {
      approval: {
        approval: 42,
        disapproval: 55,
        lastUpdated: "Jan 2026",
        source: "Gallup/538 Aggregate",
        trend: "falling"
      },
      sentiment: "mixed",
      summary: "Trump began his second term with approval ratings above 50%, but support has declined significantly. His approval has dropped to the mid-30s to low-40s depending on the poll, driven by economic concerns, the longest government shutdown in history, and controversial policy decisions. Strong support remains among Republicans (~89%) but independents have soured.",
      controversies: [
        "Record-long government shutdown over budget disputes",
        "Mass deportation operations drawing legal challenges",
        "Tariff policies causing economic uncertainty",
        "DOGE cuts to federal workforce"
      ],
      achievements: [
        "Won popular vote in 2024 election",
        "Secured Republican trifecta in Congress",
        "Implemented major deregulation initiatives"
      ]
    }
  },
  "jd vance": {
    keywords: ["jd vance", "vice president vance"],
    since: "Jan 2025",
    termEnds: "Jan 2029",
    party: "Republican",
    focus: ["tech policy", "populism", "foreign policy"],
    bio: {
      birthYear: 1984,
      birthPlace: "Middletown, Ohio, USA",
      education: "Yale Law School; Ohio State University",
      previousRoles: ["U.S. Senator from Ohio (2023-2025)", "Venture Capitalist", "Author"],
      background: 'Author of the bestselling memoir "Hillbilly Elegy" about his upbringing in working-class Appalachia. Served in the U.S. Marine Corps during the Iraq War, later attended Yale Law School and worked in venture capital in Silicon Valley. Once a Trump critic, he became a strong ally and was selected as running mate in 2024. At 40, he is one of the youngest Vice Presidents in U.S. history.'
    },
    publicConsensus: {
      sentiment: "mixed",
      summary: 'Vance has emerged as a prominent voice for populist conservatism and "new right" ideology. He is seen as a potential future presidential candidate. His transformation from Trump critic to loyal ally has drawn both praise for pragmatism and criticism for opportunism. His book remains influential in understanding rural American discontent.',
      controversies: [
        "Past critical comments about Trump resurfaced during campaign",
        '"Childless cat ladies" comments drew widespread criticism',
        "Close ties to tech billionaires like Peter Thiel"
      ],
      achievements: [
        "Youngest VP in decades, representing generational shift",
        "Bestselling author bringing attention to Appalachian poverty",
        "Influential voice on tech regulation and foreign policy"
      ]
    }
  },
  "xi jinping": {
    keywords: ["xi jinping", "xi", "chinese president"],
    since: "Mar 2013",
    party: "CCP",
    focus: ["taiwan", "belt and road", "tech dominance"],
    bio: {
      birthYear: 1953,
      birthPlace: "Beijing, China",
      education: "Tsinghua University (Chemical Engineering, Law)",
      previousRoles: [
        "Vice President of China (2008-2013)",
        "Governor of Fujian",
        "Party Secretary of Zhejiang and Shanghai"
      ],
      background: "The most powerful Chinese leader since Mao Zedong. Rose through provincial leadership positions before becoming General Secretary of the Communist Party in 2012. In 2018, he abolished presidential term limits, allowing him to potentially rule for life. He has centralized power, eliminated rivals through anti-corruption campaigns, and pursued an assertive foreign policy including militarization of the South China Sea."
    },
    publicConsensus: {
      sentiment: "mixed",
      summary: 'Domestically, Xi maintains firm control with limited public dissent tolerated. Internationally, he is viewed with increasing concern by Western democracies due to human rights issues, Taiwan tensions, and economic coercion. However, he remains popular in the Global South and among countries in the Belt and Road Initiative. His "wolf warrior" diplomacy has strained relations with many Western nations.',
      controversies: [
        "Uyghur detention camps in Xinjiang drawing genocide accusations",
        "Crackdown on Hong Kong democracy movement",
        "Military pressure on Taiwan and disputed territories",
        "Zero-COVID policy caused significant economic damage",
        "Suppression of tech sector and private enterprise"
      ],
      achievements: [
        "Lifted hundreds of millions out of poverty",
        "Made China a global technological competitor",
        "Expanded Chinese influence through Belt and Road Initiative",
        "Modernized Chinese military significantly"
      ]
    }
  },
  "vladimir putin": {
    keywords: ["putin", "kremlin", "russian president"],
    since: "May 2012",
    termEnds: "May 2030",
    party: "United Russia",
    focus: ["ukraine war", "nato expansion", "energy"],
    bio: {
      birthYear: 1952,
      birthPlace: "Leningrad (now St. Petersburg), Russia",
      education: "Leningrad State University (Law)",
      previousRoles: [
        "Prime Minister of Russia (1999, 2008-2012)",
        "President (2000-2008)",
        "Director of FSB",
        "KGB Officer"
      ],
      background: "Former KGB intelligence officer who has dominated Russian politics for over two decades. After serving as President (2000-2008) and Prime Minister (2008-2012), he returned to the presidency. In 2020, constitutional changes allowed him to potentially remain in power until 2036. He launched the full-scale invasion of Ukraine in February 2022, the largest military conflict in Europe since World War II."
    },
    publicConsensus: {
      approval: {
        approval: 78,
        disapproval: 15,
        lastUpdated: "Jan 2026",
        source: "Levada Center",
        trend: "stable"
      },
      sentiment: "very negative",
      summary: "Domestically, Putin maintains high approval ratings (~78%) though independent polling is limited and dissent is criminalized. Internationally, he is widely condemned in the West as a war criminal and authoritarian. The ICC has issued an arrest warrant for him. Russia has become increasingly isolated from Western economies and institutions, though maintains ties with China, India, and other nations refusing to condemn the Ukraine invasion.",
      controversies: [
        "Full-scale invasion of Ukraine causing massive casualties",
        "ICC arrest warrant for alleged war crimes (deportation of children)",
        "Poisoning of opposition figures (Navalny, Skripal)",
        "Election interference in Western democracies",
        "Suppression of independent media and political opposition",
        "Annexation of Crimea (2014) and Ukrainian territories"
      ],
      achievements: [
        "Restored Russian influence on world stage after 1990s collapse",
        "Modernized Russian military capabilities",
        "Maintained domestic political stability for two decades"
      ]
    }
  },
  "keir starmer": {
    keywords: ["starmer", "uk pm", "british prime minister"],
    since: "Jul 2024",
    termEnds: "Jul 2029",
    party: "Labour",
    focus: ["economy", "NHS reform", "housing"],
    bio: {
      birthYear: 1962,
      birthPlace: "London, England",
      education: "Oxford University (Law); Leeds University",
      previousRoles: [
        "Leader of the Opposition (2020-2024)",
        "Director of Public Prosecutions (2008-2013)",
        "Human Rights Adviser"
      ],
      background: "Former barrister and Director of Public Prosecutions who was knighted in 2014 for services to law and criminal justice. Led Labour to a landslide victory in 2024, ending 14 years of Conservative rule. Known for his methodical, forensic approach to politics and his transformation of Labour from the Corbyn era."
    },
    publicConsensus: {
      approval: {
        approval: 24,
        disapproval: 60,
        lastUpdated: "Jan 2026",
        source: "Morning Consult",
        trend: "falling"
      },
      sentiment: "negative",
      summary: "Starmer won a historic landslide but has seen rapid decline in popularity. Critics from the left accuse him of abandoning progressive policies, while others cite a perceived lack of charisma and vision. His government has struggled with economic challenges inherited from the Conservatives, and controversies over accepting gifts from donors have damaged his image. He remains one of the least popular leaders in Europe despite his recent victory.",
      controversies: [
        "Accepting expensive gifts and hospitality from donors",
        "Perceived abandonment of left-wing policies",
        "Criticism for cautious, managerial style lacking vision",
        "Handling of winter fuel payment cuts for pensioners"
      ],
      achievements: [
        "Led Labour to largest majority since 1997",
        "Ended 14 years of Conservative government",
        "Reformed Labour Party and restored electability"
      ]
    }
  },
  "emmanuel macron": {
    keywords: ["macron", "french president", "elysee"],
    since: "May 2017",
    termEnds: "May 2027",
    party: "Renaissance",
    focus: ["EU leadership", "pension reform", "defense"],
    bio: {
      birthYear: 1977,
      birthPlace: "Amiens, France",
      education: "Sciences Po; ENA; University of Paris-Nanterre (Philosophy)",
      previousRoles: [
        "Minister of Economy (2014-2016)",
        "Deputy Secretary-General to the President",
        "Investment Banker at Rothschild"
      ],
      background: 'Former civil servant and investment banker who founded the centrist political movement En Marche! in 2016. Became the youngest President in French history at age 39. Re-elected in 2022 but lost his parliamentary majority. His decision to call snap elections in 2024 backfired, leaving him a weakened "lame duck" president.'
    },
    publicConsensus: {
      approval: {
        approval: 15,
        disapproval: 78,
        lastUpdated: "Jan 2026",
        source: "Morning Consult",
        trend: "falling"
      },
      sentiment: "very negative",
      summary: "Macron is the least popular leader among major democracies tracked. His approval collapsed after calling snap elections in 2024 that empowered both far-right and far-left parties. Three-quarters of French citizens disapprove of his leadership. He is seen as arrogant and out of touch by critics, though supporters credit him with pro-business reforms and EU leadership. He cannot run again in 2027 due to term limits.",
      controversies: [
        "Disastrous snap election gamble in 2024",
        "Forcing through pension reform without parliament vote",
        "Yellow vest protests against fuel taxes and inequality",
        'Perceived elitism and "president of the rich" image'
      ],
      achievements: [
        "Youngest French president in history",
        "Led EU response to Ukraine crisis",
        "Economic reforms improved French competitiveness",
        "Successfully hosted 2024 Paris Olympics"
      ]
    }
  },
  "olaf scholz": {
    keywords: ["scholz", "german chancellor", "berlin"],
    since: "Dec 2021",
    termEnds: "Feb 2025",
    party: "SPD",
    focus: ["ukraine support", "energy transition", "economy"],
    bio: {
      birthYear: 1958,
      birthPlace: "Osnabrück, Germany",
      education: "University of Hamburg (Law)",
      previousRoles: [
        "Vice Chancellor and Finance Minister (2018-2021)",
        "First Mayor of Hamburg (2011-2018)",
        "Minister of Labour"
      ],
      background: 'Long-serving SPD politician who led a three-party "traffic light" coalition (SPD, Greens, FDP). His government collapsed in late 2024 after firing Finance Minister Christian Lindner. He faces snap elections in February 2025 and is expected to be replaced by CDU leader Friedrich Merz.'
    },
    publicConsensus: {
      approval: {
        approval: 20,
        disapproval: 72,
        lastUpdated: "Jan 2026",
        source: "Forsa/Morning Consult",
        trend: "falling"
      },
      sentiment: "negative",
      summary: 'Scholz led Germany through the energy crisis triggered by the Ukraine war but his coalition collapsed due to internal disputes. He is criticized for being indecisive, slow to act, and poor at communicating. His "Zeitenwende" (turning point) speech promising defense spending was not fully delivered. The German economy has struggled under his leadership with recession concerns.',
      controversies: [
        "Coalition collapse after firing Finance Minister",
        "Slow, hesitant response to Ukraine crisis initially",
        "Economic stagnation and deindustrialization concerns",
        "Cum-ex tax scandal investigation from Hamburg days"
      ],
      achievements: [
        "Navigated energy crisis after Russian gas cutoff",
        "Maintained German support for Ukraine",
        "Historic defense spending increase commitment"
      ]
    }
  },
  "giorgia meloni": {
    keywords: ["meloni", "italian pm", "italy prime minister"],
    since: "Oct 2022",
    party: "Brothers of Italy",
    focus: ["immigration", "EU relations", "economy"],
    bio: {
      birthYear: 1977,
      birthPlace: "Rome, Italy",
      education: "Amerigo Vespucci Language High School",
      previousRoles: [
        "Minister of Youth (2008-2011)",
        "Member of Chamber of Deputies",
        "Leader of Brothers of Italy (since 2014)"
      ],
      background: "Italy's first female Prime Minister and leader of the right-wing Brothers of Italy party, which has roots in post-fascist movements. Despite initial fears, she has maintained EU and NATO alignment while pursuing conservative domestic policies, particularly on immigration."
    },
    publicConsensus: {
      approval: {
        approval: 43,
        disapproval: 50,
        lastUpdated: "Jan 2026",
        source: "Morning Consult",
        trend: "stable"
      },
      sentiment: "mixed",
      summary: "Meloni has defied expectations by governing more pragmatically than her far-right rhetoric suggested. She has maintained strong EU and NATO ties while being hawkish on immigration. Domestically, she remains popular with her base, though critics worry about democratic backsliding and ties to her party's post-fascist origins. She has become an influential figure in European conservative politics.",
      controversies: [
        "Brothers of Italy party's neo-fascist roots",
        "Controversial Albania migrant processing deal",
        "Criticism from LGBTQ+ groups over family policies",
        "Libel lawsuits against journalists and critics"
      ],
      achievements: [
        "First female Prime Minister of Italy",
        "Maintained government stability (rare for Italy)",
        "Strong EU and NATO partner despite far-right label",
        "Reduced irregular migration through controversial deals"
      ]
    }
  },
  "benjamin netanyahu": {
    keywords: ["netanyahu", "bibi", "israeli pm"],
    since: "Dec 2022",
    party: "Likud",
    focus: ["gaza", "iran", "judicial reform"],
    bio: {
      birthYear: 1949,
      birthPlace: "Tel Aviv, Israel",
      education: "MIT (Architecture, Business Administration)",
      previousRoles: [
        "Prime Minister (1996-1999, 2009-2021)",
        "Finance Minister",
        "Foreign Minister",
        "IDF Special Forces"
      ],
      background: `Israel's longest-serving Prime Minister, known as "Bibi." Served in the elite Sayeret Matkal unit and lost his brother Yonatan in the famous Entebbe raid. A polarizing figure who has dominated Israeli politics for decades. Currently leading Israel through its war in Gaza following the October 7, 2023 Hamas attacks.`
    },
    publicConsensus: {
      sentiment: "very negative",
      summary: "Netanyahu is one of the most polarizing leaders globally. Domestically, he faces massive protests over judicial reform and is on trial for corruption. The October 7 security failure has been blamed on his government. Internationally, he faces criticism over Gaza civilian casualties and an ICC arrest warrant. However, his supporters see him as essential for Israeli security against Iran and Hamas.",
      controversies: [
        "ICC arrest warrant for alleged war crimes in Gaza",
        "Ongoing corruption trial (bribery, fraud, breach of trust)",
        "Judicial overhaul sparked massive domestic protests",
        "Intelligence failures leading to October 7 attacks",
        "Gaza war civilian casualty toll drawing international condemnation",
        "Tensions with Biden administration over war conduct"
      ],
      achievements: [
        "Abraham Accords normalizing ties with Arab states",
        "Israel's longest-serving Prime Minister",
        "Economic growth and tech sector development",
        "Strong stance against Iranian nuclear program"
      ]
    }
  },
  "mohammed bin salman": {
    keywords: ["mbs", "saudi crown prince", "bin salman"],
    since: "Jun 2017",
    party: "Royal Family",
    focus: ["vision 2030", "oil", "regional influence"],
    bio: {
      birthYear: 1985,
      birthPlace: "Riyadh, Saudi Arabia",
      education: "King Saud University (Law)",
      previousRoles: [
        "Minister of Defense (2015-present)",
        "Chairman of Council for Economic and Development Affairs",
        "Various royal advisory roles"
      ],
      background: 'The de facto ruler of Saudi Arabia as Crown Prince and Prime Minister. Known as "MBS," he has pursued ambitious modernization through Vision 2030 while maintaining authoritarian control. He has allowed women to drive, opened entertainment venues, but crushed dissent. He is preparing Saudi Arabia for a post-oil economy while remaining a key player in global energy markets.'
    },
    publicConsensus: {
      sentiment: "mixed",
      summary: "MBS is seen as a complex figure: a modernizer bringing social reforms to a conservative kingdom, but also an authoritarian accused of brutal repression. The Khashoggi murder severely damaged his international reputation. Western governments maintain pragmatic ties due to Saudi oil influence. He has pursued ambitious mega-projects (NEOM, The Line) while cracking down on any opposition.",
      controversies: [
        "Assassination of journalist Jamal Khashoggi in Istanbul consulate",
        "Mass detention of activists, royals in Ritz-Carlton crackdown",
        "Yemen war causing humanitarian catastrophe",
        "Execution rates have increased dramatically",
        "Human rights activists imprisoned and tortured"
      ],
      achievements: [
        "Vision 2030 economic diversification program",
        "Social reforms: women driving, entertainment, tourism",
        "Regional diplomacy including China-brokered Iran deal",
        "Massive sovereign wealth fund investments globally"
      ]
    }
  },
  "ali khamenei": {
    keywords: ["khamenei", "supreme leader", "ayatollah"],
    since: "Jun 1989",
    party: "Islamic Republic",
    focus: ["nuclear program", "proxies", "sanctions"],
    bio: {
      birthYear: 1939,
      birthPlace: "Mashhad, Iran",
      education: "Islamic seminaries in Qom and Najaf",
      previousRoles: [
        "President of Iran (1981-1989)",
        "Minister of Defense",
        "Revolutionary leader and cleric"
      ],
      background: "Shia cleric who became Supreme Leader after the death of Ayatollah Khomeini. Holds highest authority in Iran's political and religious system. Has served in the role for over three decades, maintaining Iran's theocratic system through periods of reform and hardline rule."
    },
    publicConsensus: {
      sentiment: "very negative",
      summary: "Iran's Supreme Leader for over 35 years, Khamenei holds ultimate authority over all branches of government. Internationally condemned for supporting proxy militias across the Middle East, pursuing nuclear weapons capability, and brutal suppression of domestic protests. The 2022 Woman, Life, Freedom protests saw massive crackdowns under his authority.",
      controversies: [
        "Brutal suppression of 2022 Woman, Life, Freedom protests",
        "Nuclear weapons program concerns",
        "Support for Hamas, Hezbollah, Houthis, and other proxies",
        "Execution of thousands of political prisoners",
        "Internet shutdowns and media censorship"
      ],
      achievements: [
        "Maintained regime stability for over 35 years",
        "Built extensive regional proxy network",
        "Advanced ballistic missile program"
      ]
    }
  },
  "narendra modi": {
    keywords: ["modi", "indian pm", "india prime minister"],
    since: "May 2014",
    party: "BJP",
    focus: ["economy", "china border", "technology"],
    bio: {
      birthYear: 1950,
      birthPlace: "Vadnagar, Gujarat, India",
      education: "Gujarat University (Political Science); Delhi University (MA)",
      previousRoles: [
        "Chief Minister of Gujarat (2001-2014)",
        "BJP General Secretary",
        "RSS Organizer"
      ],
      background: "Rose through the ranks of the RSS and BJP organizations. Served as Chief Minister of Gujarat for over 12 years before becoming Prime Minister. Currently serving third consecutive term after victories in 2014, 2019, and 2024. Has pursued Hindu nationalist agenda while promoting economic development."
    },
    publicConsensus: {
      approval: {
        approval: 68,
        disapproval: 28,
        lastUpdated: "Jan 2026",
        source: "Morning Consult",
        trend: "stable"
      },
      sentiment: "mixed",
      summary: "Modi remains one of the world's most popular democratically elected leaders. Supporters credit him with economic growth, infrastructure development, and raising India's global profile. Critics accuse him of Hindu nationalism, democratic backsliding, and persecution of minorities. His government has been accused of using state apparatus against opposition figures.",
      controversies: [
        "Allegations of democratic backsliding and press freedom decline",
        "Citizenship Amendment Act protests and treatment of Muslims",
        "2002 Gujarat riots when he was Chief Minister",
        "Adani stock manipulation scandal and opposition crackdowns",
        "Kashmir autonomy revocation and communications blackout"
      ],
      achievements: [
        "Three consecutive electoral victories",
        "Major infrastructure development (roads, railways, airports)",
        "Raised India's global diplomatic profile",
        "Digital India initiative and financial inclusion programs"
      ]
    }
  },
  "kim jong un": {
    keywords: ["kim jong un", "north korea", "pyongyang"],
    since: "Dec 2011",
    party: "Workers' Party",
    focus: ["nuclear", "missiles", "russia alliance"],
    bio: {
      birthYear: 1984,
      birthPlace: "Pyongyang, North Korea",
      education: "Kim Il Sung Military University; reportedly studied in Switzerland",
      previousRoles: ["Vice Chairman of Central Military Commission", "Heir apparent under Kim Jong Il"],
      background: "Third generation leader of North Korea, succeeding his father Kim Jong Il in 2011. Holds multiple titles including General Secretary of the Workers' Party and Supreme Commander of the Armed Forces. Has dramatically accelerated North Korea's nuclear and missile programs."
    },
    publicConsensus: {
      sentiment: "very negative",
      summary: "Kim Jong Un runs one of the world's most repressive regimes. North Korea has no free press, no elections, and maintains an extensive gulag system. Under his rule, nuclear and missile tests have accelerated. He has cultivated closer ties with Russia and China while facing severe international sanctions.",
      controversies: [
        "Execution of family members including uncle Jang Song-thaek",
        "Assassination of half-brother Kim Jong-nam with VX nerve agent",
        "Massive gulag system holding hundreds of thousands",
        "Nuclear and ICBM testing threatening regional stability",
        "Severe food insecurity while pursuing weapons programs"
      ],
      achievements: [
        "Advanced nuclear weapons capability",
        "ICBM development capable of reaching US mainland",
        "Historic summits with Trump and Moon Jae-in",
        "Strengthened alliance with Russia and China"
      ]
    }
  },
  "shigeru ishiba": {
    keywords: ["ishiba", "japanese pm", "japan prime minister"],
    since: "Oct 2024",
    party: "LDP",
    focus: ["defense", "china", "us alliance"],
    bio: {
      birthYear: 1957,
      birthPlace: "Tottori Prefecture, Japan",
      education: "Keio University (Law)",
      previousRoles: ["Minister of Defense (twice)", "Minister of Agriculture", "LDP Secretary-General"],
      background: "Long-serving LDP politician known for expertise in defense and security policy. Made multiple bids for LDP leadership before succeeding in 2024. Known for his detailed policy knowledge and independent stance within the party."
    },
    publicConsensus: {
      approval: {
        approval: 34,
        disapproval: 46,
        lastUpdated: "Jan 2026",
        source: "NHK/Japanese polls",
        trend: "falling"
      },
      sentiment: "mixed",
      summary: "Ishiba became PM after years of trying but faces challenges with a weak electoral mandate. Known as a defense hawk who has proposed an Asian NATO-style alliance. His government lost its parliamentary majority in the 2024 election, forcing him to govern as a minority. Respected for policy expertise but seen as lacking political charisma.",
      controversies: [
        "Lost parliamentary majority shortly after taking office",
        "Proposals for Asian NATO seen as provocative by China",
        "Political fundraising scandal within LDP",
        "Tensions with party factions who opposed his leadership"
      ],
      achievements: [
        "Finally achieved LDP leadership after multiple attempts",
        "Strong defense policy credentials",
        "Maintained US-Japan alliance strength"
      ]
    }
  },
  "lai ching-te": {
    keywords: ["lai ching-te", "taiwan president", "taipei", "william lai"],
    since: "May 2024",
    party: "DPP",
    focus: ["china relations", "defense", "semiconductors"],
    bio: {
      birthYear: 1959,
      birthPlace: "New Taipei City, Taiwan",
      education: "Harvard University (Public Health); National Cheng Kung University (Medicine)",
      previousRoles: [
        "Vice President (2020-2024)",
        "Premier (2017-2019)",
        "Mayor of Tainan",
        "Legislator"
      ],
      background: "Physician who transitioned to politics, serving as legislator and mayor before national roles. Succeeded Tsai Ing-wen as DPP candidate and won the 2024 presidential election despite Chinese pressure."
    },
    publicConsensus: {
      sentiment: "mixed",
      summary: "Lai represents continuity with Tsai Ing-wen's policies of maintaining Taiwan's de facto independence while avoiding provocation of China. Beijing considers him a 'separatist' and has increased military pressure since his election. He faces the challenge of maintaining US support while managing cross-strait tensions. Domestically popular but constrained by lacking legislative majority.",
      controversies: [
        'Beijing labels him a "dangerous separatist"',
        "Governing without legislative majority (hung parliament)",
        "Balance between US and China relations",
        "Housing affordability and economic inequality concerns"
      ],
      achievements: [
        "Won presidency despite unprecedented Chinese interference",
        "Maintained strong US-Taiwan relations",
        "Continued strengthening Taiwan defense capabilities"
      ]
    }
  },
  "volodymyr zelensky": {
    keywords: ["zelensky", "ukraine president", "kyiv", "zelenskyy"],
    since: "May 2019",
    party: "Servant of the People",
    focus: ["war", "western aid", "nato membership"],
    bio: {
      birthYear: 1978,
      birthPlace: "Kryvyi Rih, Ukraine",
      education: "Kyiv National Economic University (Law)",
      previousRoles: ["Actor and Comedian", "Producer at Kvartal 95", "Voice Actor"],
      background: `Entertainer and producer who starred in the TV series "Servant of the People" playing a teacher who becomes president. Founded the political party of the same name and won the 2019 presidential election. Has led Ukraine since Russia's full-scale invasion in 2022, becoming a symbol of Ukrainian resistance.`
    },
    publicConsensus: {
      approval: {
        approval: 57,
        disapproval: 38,
        lastUpdated: "Jan 2026",
        source: "KIIS Ukraine",
        trend: "falling"
      },
      sentiment: "positive",
      summary: 'Zelensky transformed from comedian to wartime leader, becoming an international symbol of resistance against Russian aggression. His decision to stay in Kyiv during the invasion ("I need ammunition, not a ride") galvanized Ukrainian resistance and Western support. Domestically, approval has declined from wartime highs due to war fatigue and mobilization concerns. Internationally, he remains highly regarded in Western democracies.',
      controversies: [
        "Martial law and postponement of elections during wartime",
        "Mobilization policies and age limit debates",
        "Pre-war corruption concerns (though fighting has reduced this)",
        "Tensions with some Western allies over pace of support"
      ],
      achievements: [
        "Rallied Ukraine and West against Russian invasion",
        "Secured unprecedented Western military and financial aid",
        "Maintained Ukrainian sovereignty against larger adversary",
        "EU membership candidate status achieved"
      ]
    }
  },
  "javier milei": {
    keywords: ["milei", "argentina president", "buenos aires"],
    since: "Dec 2023",
    party: "La Libertad Avanza",
    focus: ["dollarization", "spending cuts", "deregulation"],
    bio: {
      birthYear: 1970,
      birthPlace: "Buenos Aires, Argentina",
      education: "University of Belgrano (Economics); ESEADE (Economics)",
      previousRoles: [
        "National Deputy (2021-2023)",
        "Economist",
        "Television Commentator",
        "University Professor"
      ],
      background: "Economist who gained prominence as a media commentator known for libertarian views and theatrical style. Elected to Congress in 2021 and won the presidency in 2023 on a platform of radical economic reform and reducing government size. Known for his signature chainsaw prop and rock star-like rallies."
    },
    publicConsensus: {
      approval: {
        approval: 47,
        disapproval: 48,
        lastUpdated: "Jan 2026",
        source: "Morning Consult",
        trend: "stable"
      },
      sentiment: "mixed",
      summary: "Milei has implemented aggressive austerity measures including massive spending cuts and deregulation. Inflation has begun to fall but recession and poverty have worsened. He is polarizing - supporters see him as necessary shock therapy for Argentina, critics see reckless destruction of social programs. His unconventional style and social media presence have made him a global libertarian icon.",
      controversies: [
        "Deep austerity causing recession and poverty spike",
        "Abolition of ministries and mass public sector layoffs",
        "Inflammatory rhetoric and insults toward critics",
        "Close alignment with Trump and Musk"
      ],
      achievements: [
        "Reduced inflation from 25% monthly to single digits",
        "Achieved fiscal surplus for first time in years",
        "Major deregulation of economy",
        "Currency stabilization progress"
      ]
    }
  },
  "luiz inacio lula da silva": {
    keywords: ["lula", "brazil president", "brasilia", "lula da silva"],
    since: "Jan 2023",
    party: "PT",
    focus: ["amazon", "social programs", "brics"],
    bio: {
      birthYear: 1945,
      birthPlace: "Garanhuns, Pernambuco, Brazil",
      education: "Limited formal education; metalworker training",
      previousRoles: ["President of Brazil (2003-2010)", "Union Leader", "Founding Member of PT"],
      background: "Former metalworker and union leader who co-founded the Workers' Party (PT). Served as President from 2003-2010, overseeing economic growth and social programs that lifted millions from poverty. Convicted of corruption in 2017 and imprisoned until convictions were annulled. Returned to power in 2023 after defeating Bolsonaro."
    },
    publicConsensus: {
      approval: {
        approval: 41,
        disapproval: 54,
        lastUpdated: "Jan 2026",
        source: "Morning Consult",
        trend: "falling"
      },
      sentiment: "mixed",
      summary: "Lula's third term has been marked by efforts to restore social programs and Amazon protections dismantled under Bolsonaro. However, economic challenges and political polarization have limited his effectiveness. He faces a hostile Congress and persistent distrust from Bolsonaro supporters. Internationally, he has sought to position Brazil as a neutral mediator while maintaining BRICS ties.",
      controversies: [
        "Prior corruption convictions (later annulled on procedural grounds)",
        "Controversial statements about Israel-Gaza conflict",
        "Failure to condemn Russian invasion of Ukraine",
        "Economic challenges and high interest rates"
      ],
      achievements: [
        "Reduced Amazon deforestation from Bolsonaro-era highs",
        "Restored social programs and environmental protections",
        "Peacefully assumed power after January 8 riots",
        "Reasserted Brazilian diplomatic presence globally"
      ]
    }
  },
  "mark carney": {
    keywords: ["carney", "canadian pm", "canada prime minister", "ottawa"],
    since: "Mar 2025",
    party: "Liberal",
    focus: ["tariffs", "us relations", "economy"],
    bio: {
      birthYear: 1965,
      birthPlace: "Fort Smith, Northwest Territories, Canada",
      education: "Harvard University (Economics); Oxford University (Economics PhD)",
      previousRoles: [
        "Governor of Bank of England (2013-2020)",
        "Governor of Bank of Canada (2008-2013)",
        "Goldman Sachs Executive"
      ],
      background: "Economist and former central banker who led both the Bank of Canada and Bank of England - the first person to head two major central banks. Navigated the 2008 financial crisis and Brexit. Entered politics after his banking career, becoming Liberal Party leader and Prime Minister as Canada faces trade tensions with the Trump administration."
    },
    publicConsensus: {
      sentiment: "mixed",
      summary: "Carney brings unprecedented economic credentials to the PM role as Canada faces existential trade threats from US tariffs. His lack of political experience is seen as both an asset (outsider credentials) and liability (untested in partisan combat). He must navigate the Trump administration while maintaining Canadian sovereignty and economic stability.",
      controversies: [
        "No elected political experience before becoming PM",
        "Connections to global financial elite and Goldman Sachs",
        "Climate advocacy while having worked in fossil fuel-dependent economies",
        "Inheriting Liberal party with depleted popularity"
      ],
      achievements: [
        "Only person to lead two G7 central banks",
        "Successfully navigated 2008 financial crisis",
        "Led Bank of England through Brexit uncertainty",
        "UN climate finance envoy experience"
      ]
    }
  },
  "yoon suk yeol": {
    keywords: ["yoon", "south korea president", "seoul"],
    since: "May 2022",
    party: "People Power Party",
    focus: ["north korea", "japan relations", "economy"],
    bio: {
      birthYear: 1960,
      birthPlace: "Seoul, South Korea",
      education: "Seoul National University (Law)",
      previousRoles: [
        "Prosecutor General (2019-2021)",
        "Chief Prosecutor of Seoul Central District"
      ],
      background: "Former prosecutor who rose to fame investigating corruption scandals including those involving former presidents. Elected president in 2022 on an anti-corruption platform. His brief declaration of martial law in December 2024 led to his impeachment."
    },
    publicConsensus: {
      approval: {
        approval: 17,
        disapproval: 78,
        lastUpdated: "Jan 2026",
        source: "Gallup Korea",
        trend: "falling"
      },
      sentiment: "very negative",
      summary: "Yoon's presidency imploded after he briefly declared martial law in December 2024, citing 'anti-state forces.' The National Assembly voted to lift it within hours. He was impeached and is awaiting Constitutional Court ruling on removal. His approval ratings collapsed and he faces potential criminal charges. The incident shocked South Korean democracy.",
      controversies: [
        "Declared martial law in December 2024, immediately reversed by parliament",
        "Impeached by National Assembly",
        "First Lady corruption scandals and influence peddling",
        "Polarizing political style and poor approval ratings",
        "Damaged South Korean democratic reputation internationally"
      ],
      achievements: [
        "Improved Japan-South Korea relations",
        "Strengthened US-Korea alliance",
        "Took harder line on North Korea"
      ]
    }
  }
};
const LEADER_COUNTRIES = {
  "donald trump": "us",
  "jd vance": "us",
  "xi jinping": "cn",
  "vladimir putin": "ru",
  "keir starmer": "gb",
  "emmanuel macron": "fr",
  "olaf scholz": "de",
  "giorgia meloni": "it",
  "benjamin netanyahu": "il",
  "mohammed bin salman": "sa",
  "ali khamenei": "ir",
  "narendra modi": "in",
  "kim jong un": "kp",
  "shigeru ishiba": "jp",
  "lai ching-te": "tw",
  "volodymyr zelensky": "ua",
  "javier milei": "ar",
  "luiz inacio lula da silva": "br",
  "mark carney": "ca",
  "yoon suk yeol": "kr"
};
Object.entries(LEADER_ENRICHMENTS).map(
  ([name, data]) => {
    const countryCode = LEADER_COUNTRIES[name] || "";
    return {
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name: name.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
      title: "",
      // Will be filled from API
      country: COUNTRY_NAMES[countryCode] || "",
      flag: COUNTRY_FLAGS[countryCode] || "",
      ...data
    };
  }
);
const COUNTRY_ID_TO_NAME = {
  4: "Afghanistan",
  8: "Albania",
  10: "Antarctica",
  12: "Algeria",
  16: "American Samoa",
  20: "Andorra",
  24: "Angola",
  28: "Antigua and Barbuda",
  31: "Azerbaijan",
  32: "Argentina",
  36: "Australia",
  40: "Austria",
  44: "Bahamas",
  48: "Bahrain",
  50: "Bangladesh",
  51: "Armenia",
  52: "Barbados",
  54: "Belize",
  55: "Bahamas",
  56: "Belgium",
  58: "Bermuda",
  60: "Bermuda",
  62: "Turks and Caicos Islands",
  64: "Bhutan",
  68: "Bolivia",
  70: "Bosnia and Herzegovina",
  72: "Botswana",
  74: "Bouvet Island",
  76: "Brazil",
  84: "Belize",
  86: "British Indian Ocean Territory",
  90: "Solomon Islands",
  92: "British Virgin Islands",
  96: "Brunei",
  100: "Bulgaria",
  104: "Myanmar",
  108: "Burundi",
  110: "Mauritius",
  112: "Belarus",
  116: "Cambodia",
  120: "Cameroon",
  124: "Canada",
  132: "Cape Verde",
  136: "Cayman Islands",
  140: "Central African Republic",
  144: "Sri Lanka",
  148: "Chad",
  152: "Chile",
  156: "China",
  158: "Taiwan",
  162: "Christmas Island",
  166: "Cocos Islands",
  170: "Colombia",
  174: "Comoros",
  175: "Mayotte",
  178: "Congo",
  180: "Democratic Republic of the Congo",
  184: "Cook Islands",
  188: "Costa Rica",
  191: "Croatia",
  192: "Cuba",
  196: "Cyprus",
  203: "Czech Republic",
  204: "Benin",
  208: "Denmark",
  212: "Dominica",
  214: "Dominican Republic",
  218: "Ecuador",
  222: "El Salvador",
  226: "Equatorial Guinea",
  231: "Ethiopia",
  232: "Eritrea",
  233: "Estonia",
  234: "Faroe Islands",
  238: "Falkland Islands",
  239: "South Georgia and South Sandwich Islands",
  242: "Fiji",
  246: "Finland",
  248: "Åland Islands",
  250: "France",
  254: "French Guiana",
  258: "French Polynesia",
  260: "French Southern Territories",
  262: "Djibouti",
  266: "Gabon",
  268: "Georgia",
  270: "Gambia",
  276: "Germany",
  288: "Ghana",
  292: "Gibraltar",
  296: "Kiribati",
  300: "Greece",
  304: "Greenland",
  308: "Grenada",
  312: "Guadeloupe",
  316: "Guam",
  320: "Guatemala",
  324: "Guinea",
  328: "Guyana",
  332: "Haiti",
  334: "Heard Island and McDonald Islands",
  336: "Vatican City",
  340: "Honduras",
  344: "Hong Kong",
  348: "Hungary",
  352: "Iceland",
  356: "India",
  360: "Indonesia",
  364: "Iran",
  368: "Iraq",
  372: "Ireland",
  376: "Israel",
  380: "Italy",
  384: "Côte d'Ivoire",
  388: "Jamaica",
  392: "Japan",
  398: "Kazakhstan",
  400: "Jordan",
  404: "Kenya",
  408: "Korea North",
  410: "South Korea",
  414: "Kuwait",
  417: "Kyrgyzstan",
  418: "Laos",
  422: "Lebanon",
  426: "Lesotho",
  428: "Latvia",
  430: "Liberia",
  434: "Libya",
  438: "Liechtenstein",
  440: "Lithuania",
  442: "Luxembourg",
  446: "Macao",
  450: "Madagascar",
  454: "Malawi",
  458: "Malaysia",
  462: "Maldives",
  466: "Mali",
  470: "Malta",
  474: "Martinique",
  478: "Mauritania",
  480: "Mauritius",
  484: "Mexico",
  486: "Micronesia",
  492: "Monaco",
  496: "Mongolia",
  498: "Moldova",
  500: "Montserrat",
  504: "Morocco",
  508: "Mozambique",
  512: "Oman",
  516: "Namibia",
  520: "Nauru",
  524: "Nepal",
  528: "Netherlands",
  530: "Netherlands Antilles",
  533: "Aruba",
  534: "Sint Maarten",
  535: "Caribbean Netherlands",
  540: "New Caledonia",
  554: "New Zealand",
  558: "Nicaragua",
  562: "Niger",
  566: "Nigeria",
  570: "Niue",
  574: "Norfolk Island",
  578: "Norway",
  580: "Northern Mariana Islands",
  581: "United States Minor Outlying Islands",
  583: "Micronesia",
  584: "Marshall Islands",
  585: "Palau",
  586: "Pakistan",
  591: "Panama",
  598: "Papua New Guinea",
  600: "Paraguay",
  604: "Peru",
  608: "Philippines",
  612: "Pitcairn Islands",
  616: "Poland",
  620: "Portugal",
  624: "Guinea-Bissau",
  626: "Timor-Leste",
  630: "Puerto Rico",
  634: "Qatar",
  638: "Réunion",
  642: "Romania",
  643: "Russia",
  646: "Rwanda",
  652: "Saint Barthélemy",
  654: "Saint Helena",
  659: "Saint Kitts and Nevis",
  660: "Anguilla",
  662: "Saint Lucia",
  663: "Saint Martin",
  666: "Saint Pierre and Miquelon",
  670: "Saint Vincent and the Grenadines",
  674: "San Marino",
  678: "São Tomé and Príncipe",
  680: "São Tomé and Príncipe",
  682: "Saudi Arabia",
  686: "Senegal",
  688: "Serbia",
  690: "Seychelles",
  694: "Sierra Leone",
  702: "Singapore",
  703: "Slovakia",
  704: "Vietnam",
  705: "Slovenia",
  706: "Somalia",
  710: "South Africa",
  716: "Zimbabwe",
  724: "Spain",
  728: "South Sudan",
  732: "Western Sahara",
  740: "Suriname",
  744: "Svalbard and Jan Mayen",
  748: "Eswatini",
  752: "Sweden",
  756: "Switzerland",
  760: "Syria",
  762: "Tajikistan",
  764: "Thailand",
  768: "Togo",
  772: "Tokelau",
  776: "Tonga",
  780: "Trinidad and Tobago",
  784: "United Arab Emirates",
  788: "Tunisia",
  792: "Turkey",
  795: "Turkmenistan",
  796: "Turks and Caicos Islands",
  798: "Tuvalu",
  800: "Uganda",
  804: "Ukraine",
  807: "North Macedonia",
  818: "Egypt",
  826: "United Kingdom",
  831: "Guernsey",
  832: "Jersey",
  833: "Isle of Man",
  834: "Tanzania",
  840: "United States",
  850: "Virgin Islands",
  854: "Burkina Faso",
  858: "Uruguay",
  860: "Uzbekistan",
  862: "Venezuela",
  876: "Wallis and Futuna",
  887: "Yemen",
  894: "Zambia"
};
for (const [id, name] of Object.entries(COUNTRY_ID_TO_NAME)) {
}
function getDefaultSettings$1() {
  const allPanelIds = Object.keys(PANELS);
  return {
    enabled: Object.fromEntries(allPanelIds.map((id) => [id, true])),
    order: allPanelIds,
    sizes: {}
  };
}
function loadFromStorage$1() {
  return {};
}
function createSettingsStore() {
  const defaults = getDefaultSettings$1();
  const saved = loadFromStorage$1();
  const initialState = {
    enabled: { ...defaults.enabled, ...saved.enabled },
    order: saved.order ?? defaults.order,
    sizes: { ...defaults.sizes, ...saved.sizes },
    initialized: false
  };
  const { subscribe, set, update } = writable(initialState);
  return {
    subscribe,
    /**
     * Initialize store (call after hydration)
     */
    init() {
      update((state) => ({ ...state, initialized: true }));
    },
    /**
     * Check if a panel is enabled
     */
    isPanelEnabled(panelId) {
      const state = get({ subscribe });
      return state.enabled[panelId] ?? true;
    },
    /**
     * Toggle panel visibility
     */
    togglePanel(panelId) {
      update((state) => {
        const newEnabled = {
          ...state.enabled,
          [panelId]: !state.enabled[panelId]
        };
        return { ...state, enabled: newEnabled };
      });
    },
    /**
     * Enable a specific panel
     */
    enablePanel(panelId) {
      update((state) => {
        const newEnabled = { ...state.enabled, [panelId]: true };
        return { ...state, enabled: newEnabled };
      });
    },
    /**
     * Disable a specific panel
     */
    disablePanel(panelId) {
      update((state) => {
        const newEnabled = { ...state.enabled, [panelId]: false };
        return { ...state, enabled: newEnabled };
      });
    },
    /**
     * Update panel order (for drag-drop)
     */
    updateOrder(newOrder) {
      update((state) => {
        return { ...state, order: newOrder };
      });
    },
    /**
     * Move a panel to a new position
     */
    movePanel(panelId, toIndex) {
      if (NON_DRAGGABLE_PANELS.includes(panelId)) return;
      update((state) => {
        const currentIndex = state.order.indexOf(panelId);
        if (currentIndex === -1) return state;
        const newOrder = [...state.order];
        newOrder.splice(currentIndex, 1);
        newOrder.splice(toIndex, 0, panelId);
        return { ...state, order: newOrder };
      });
    },
    /**
     * Update panel size
     */
    updateSize(panelId, size) {
      update((state) => {
        const newSizes = {
          ...state.sizes,
          [panelId]: { ...state.sizes[panelId], ...size }
        };
        return { ...state, sizes: newSizes };
      });
    },
    /**
     * Reset all settings to defaults
     */
    reset() {
      const defaults2 = getDefaultSettings$1();
      set({ ...defaults2, initialized: true });
    },
    /**
     * Get panel size
     */
    getPanelSize(panelId) {
      const state = get({ subscribe });
      return state.sizes[panelId];
    },
    /**
     * Check if onboarding is complete
     */
    isOnboardingComplete() {
      return true;
    },
    /**
     * Get selected preset
     */
    getSelectedPreset() {
      return null;
    },
    /**
     * Apply a preset configuration
     */
    applyPreset(presetId) {
      const preset = PRESETS[presetId];
      if (!preset) {
        console.error("Unknown preset:", presetId);
        return;
      }
      const allPanelIds = Object.keys(PANELS);
      const newEnabled = Object.fromEntries(
        allPanelIds.map((id) => [id, preset.panels.includes(id)])
      );
      update((state) => {
        return { ...state, enabled: newEnabled };
      });
    },
    /**
     * Reset onboarding to show modal again
     */
    resetOnboarding() {
    }
  };
}
const settings = createSettingsStore();
const enabledPanels = derived(
  settings,
  ($settings) => $settings.order.filter((id) => $settings.enabled[id])
);
derived(
  settings,
  ($settings) => $settings.order.filter((id) => !$settings.enabled[id])
);
derived(
  enabledPanels,
  ($enabled) => $enabled.filter((id) => !NON_DRAGGABLE_PANELS.includes(id))
);
const MAX_MONITORS = 20;
function loadMonitors() {
  return [];
}
function generateId() {
  return `mon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
function createMonitorsStore() {
  const initialState = {
    monitors: loadMonitors(),
    matches: [],
    initialized: false
  };
  const { subscribe, set, update } = writable(initialState);
  return {
    subscribe,
    /**
     * Initialize store (call after hydration)
     */
    init() {
      update((state) => ({ ...state, initialized: true }));
    },
    /**
     * Get all monitors
     */
    getMonitors() {
      return get({ subscribe }).monitors;
    },
    /**
     * Get a specific monitor by ID
     */
    getMonitor(id) {
      return get({ subscribe }).monitors.find((m) => m.id === id);
    },
    /**
     * Add a new monitor
     */
    addMonitor(monitor) {
      const state = get({ subscribe });
      if (state.monitors.length >= MAX_MONITORS) {
        console.warn(`Maximum monitors (${MAX_MONITORS}) reached`);
        return null;
      }
      const newMonitor = {
        ...monitor,
        id: generateId(),
        createdAt: Date.now(),
        matchCount: 0
      };
      update((s) => {
        const newMonitors = [...s.monitors, newMonitor];
        return { ...s, monitors: newMonitors };
      });
      return newMonitor;
    },
    /**
     * Update an existing monitor
     */
    updateMonitor(id, updates) {
      let found = false;
      update((state) => {
        const index = state.monitors.findIndex((m) => m.id === id);
        if (index === -1) return state;
        found = true;
        const newMonitors = [...state.monitors];
        newMonitors[index] = { ...newMonitors[index], ...updates };
        return { ...state, monitors: newMonitors };
      });
      return found;
    },
    /**
     * Delete a monitor
     */
    deleteMonitor(id) {
      let found = false;
      update((state) => {
        const index = state.monitors.findIndex((m) => m.id === id);
        if (index === -1) return state;
        found = true;
        const newMonitors = state.monitors.filter((m) => m.id !== id);
        const newMatches = state.matches.filter((m) => m.monitor.id !== id);
        return { ...state, monitors: newMonitors, matches: newMatches };
      });
      return found;
    },
    /**
     * Toggle monitor enabled state
     */
    toggleMonitor(id) {
      update((state) => {
        const index = state.monitors.findIndex((m) => m.id === id);
        if (index === -1) return state;
        const newMonitors = [...state.monitors];
        newMonitors[index] = {
          ...newMonitors[index],
          enabled: !newMonitors[index].enabled
        };
        return { ...state, monitors: newMonitors };
      });
    },
    /**
     * Scan news items for monitor matches
     */
    scanForMatches(newsItems) {
      const state = get({ subscribe });
      const matches = [];
      for (const monitor of state.monitors) {
        if (!monitor.enabled) continue;
        for (const item of newsItems) {
          const textToSearch = `${item.title} ${item.description || ""}`.toLowerCase();
          const matchedKeywords = [];
          for (const keyword of monitor.keywords) {
            if (textToSearch.includes(keyword.toLowerCase())) {
              matchedKeywords.push(keyword);
            }
          }
          if (matchedKeywords.length > 0) {
            matches.push({ monitor, item, matchedKeywords });
          }
        }
      }
      update((s) => {
        const newMonitors = s.monitors.map((m) => ({
          ...m,
          matchCount: matches.filter((match) => match.monitor.id === m.id).length
        }));
        return { ...s, monitors: newMonitors, matches };
      });
      return matches;
    },
    /**
     * Clear all matches
     */
    clearMatches() {
      update((state) => ({ ...state, matches: [] }));
    },
    /**
     * Reset all monitors
     */
    reset() {
      set({ monitors: [], matches: [], initialized: true });
    }
  };
}
const monitors = createMonitorsStore();
derived(
  monitors,
  ($monitors) => $monitors.monitors.filter((m) => m.enabled)
);
derived(monitors, ($monitors) => $monitors.monitors.length);
derived(monitors, ($monitors) => $monitors.matches.length);
derived(monitors, ($monitors) => $monitors.matches.length > 0);
const NEWS_CATEGORIES = ["politics", "tech", "finance", "gov", "ai", "intel"];
function createCategoryState() {
  return {
    items: [],
    loading: false,
    error: null,
    lastUpdated: null
  };
}
function createInitialState$2() {
  const categories = {};
  for (const category of NEWS_CATEGORIES) {
    categories[category] = createCategoryState();
  }
  return { categories, initialized: false };
}
function enrichNewsItem(item) {
  const text = `${item.title} ${item.description || ""}`;
  const alertResult = containsAlertKeyword(text);
  return {
    ...item,
    isAlert: alertResult.isAlert,
    alertKeyword: alertResult.keyword,
    region: item.region ?? detectRegion(text) ?? void 0,
    topics: item.topics ?? detectTopics(text)
  };
}
function createNewsStore() {
  const { subscribe, set, update } = writable(createInitialState$2());
  return {
    subscribe,
    /**
     * Initialize store
     */
    init() {
      update((state) => ({ ...state, initialized: true }));
    },
    /**
     * Set loading state for a category
     */
    setLoading(category, loading) {
      update((state) => ({
        ...state,
        categories: {
          ...state.categories,
          [category]: {
            ...state.categories[category],
            loading,
            error: loading ? null : state.categories[category].error
          }
        }
      }));
    },
    /**
     * Set error state for a category
     */
    setError(category, error) {
      update((state) => ({
        ...state,
        categories: {
          ...state.categories,
          [category]: {
            ...state.categories[category],
            loading: false,
            error
          }
        }
      }));
    },
    /**
     * Set items for a category
     */
    setItems(category, items) {
      const enrichedItems = items.map(enrichNewsItem);
      update((state) => ({
        ...state,
        categories: {
          ...state.categories,
          [category]: {
            items: enrichedItems,
            loading: false,
            error: null,
            lastUpdated: Date.now()
          }
        }
      }));
    },
    /**
     * Append items to a category (for pagination)
     */
    appendItems(category, items) {
      const enrichedItems = items.map(enrichNewsItem);
      update((state) => {
        const existing = state.categories[category].items;
        const existingIds = new Set(existing.map((i) => i.id));
        const newItems = enrichedItems.filter((i) => !existingIds.has(i.id));
        return {
          ...state,
          categories: {
            ...state.categories,
            [category]: {
              ...state.categories[category],
              items: [...existing, ...newItems],
              loading: false,
              error: null,
              lastUpdated: Date.now()
            }
          }
        };
      });
    },
    /**
     * Get items for a category
     */
    getItems(category) {
      return get({ subscribe }).categories[category].items;
    },
    /**
     * Get all items across all categories
     */
    getAllItems() {
      const state = get({ subscribe });
      const allItems = [];
      for (const category of NEWS_CATEGORIES) {
        allItems.push(...state.categories[category].items);
      }
      return allItems;
    },
    /**
     * Get alert items (items with alert keywords)
     */
    getAlertItems() {
      const state = get({ subscribe });
      const alerts2 = [];
      for (const category of NEWS_CATEGORIES) {
        alerts2.push(...state.categories[category].items.filter((i) => i.isAlert));
      }
      return alerts2.sort((a, b) => b.timestamp - a.timestamp);
    },
    /**
     * Clear a category
     */
    clearCategory(category) {
      update((state) => ({
        ...state,
        categories: {
          ...state.categories,
          [category]: createCategoryState()
        }
      }));
    },
    /**
     * Clear all categories
     */
    clearAll() {
      set(createInitialState$2());
    },
    /**
     * Check if any category is loading
     */
    isAnyLoading() {
      const state = get({ subscribe });
      return NEWS_CATEGORIES.some((cat) => state.categories[cat].loading);
    }
  };
}
const news = createNewsStore();
derived(news, ($news) => $news.categories.politics);
derived(news, ($news) => $news.categories.tech);
derived(news, ($news) => $news.categories.finance);
derived(news, ($news) => $news.categories.gov);
derived(news, ($news) => $news.categories.ai);
derived(news, ($news) => $news.categories.intel);
derived(news, ($news) => {
  const allItems = [];
  for (const category of NEWS_CATEGORIES) {
    allItems.push(...$news.categories[category].items);
  }
  return allItems;
});
derived(news, ($news) => {
  const allAlerts = [];
  for (const category of NEWS_CATEGORIES) {
    allAlerts.push(...$news.categories[category].items.filter((i) => i.isAlert));
  }
  return allAlerts.sort((a, b) => b.timestamp - a.timestamp);
});
derived(
  news,
  ($news) => NEWS_CATEGORIES.some((cat) => $news.categories[cat].loading)
);
derived(
  news,
  ($news) => NEWS_CATEGORIES.some((cat) => $news.categories[cat].error !== null)
);
function createInitialState$1() {
  const emptySection = {
    items: [],
    loading: false,
    error: null,
    lastUpdated: null
  };
  return {
    indices: { ...emptySection },
    sectors: { ...emptySection },
    commodities: { ...emptySection },
    crypto: { ...emptySection },
    custom: { ...emptySection },
    initialized: false
  };
}
function createMarketsStore() {
  const { subscribe, set, update } = writable(createInitialState$1());
  return {
    subscribe,
    /**
     * Initialize store
     */
    init() {
      update((state) => ({ ...state, initialized: true }));
    },
    /**
     * Set loading state for a category
     */
    setLoading(category, loading) {
      update((state) => ({
        ...state,
        [category]: {
          ...state[category],
          loading,
          error: loading ? null : state[category].error
        }
      }));
    },
    /**
     * Set error state for a category
     */
    setError(category, error) {
      update((state) => ({
        ...state,
        [category]: {
          ...state[category],
          loading: false,
          error
        }
      }));
    },
    /**
     * Set indices data
     */
    setIndices(items) {
      update((state) => ({
        ...state,
        indices: {
          items,
          loading: false,
          error: null,
          lastUpdated: Date.now()
        }
      }));
    },
    /**
     * Set sectors data
     */
    setSectors(items) {
      update((state) => ({
        ...state,
        sectors: {
          items,
          loading: false,
          error: null,
          lastUpdated: Date.now()
        }
      }));
    },
    /**
     * Set commodities data
     */
    setCommodities(items) {
      update((state) => ({
        ...state,
        commodities: {
          items,
          loading: false,
          error: null,
          lastUpdated: Date.now()
        }
      }));
    },
    /**
     * Set crypto data
     */
    setCrypto(items) {
      update((state) => ({
        ...state,
        crypto: {
          items,
          loading: false,
          error: null,
          lastUpdated: Date.now()
        }
      }));
    },
    /**
     * Set custom market data
     */
    setCustom(items) {
      update((state) => ({
        ...state,
        custom: {
          items,
          loading: false,
          error: null,
          lastUpdated: Date.now()
        }
      }));
    },
    /**
     * Update a single market item
     */
    updateItem(category, symbol, updates) {
      update((state) => {
        const items = state[category].items;
        const index = items.findIndex((i) => i.symbol === symbol);
        if (index === -1) return state;
        const newItems = [...items];
        newItems[index] = { ...newItems[index], ...updates };
        return {
          ...state,
          [category]: {
            ...state[category],
            items: newItems
          }
        };
      });
    },
    /**
     * Update a single crypto item
     */
    updateCrypto(id, updates) {
      update((state) => {
        const index = state.crypto.items.findIndex((i) => i.id === id);
        if (index === -1) return state;
        const newItems = [...state.crypto.items];
        newItems[index] = { ...newItems[index], ...updates };
        return {
          ...state,
          crypto: {
            ...state.crypto,
            items: newItems
          }
        };
      });
    },
    /**
     * Get market summary
     */
    getSummary() {
      const state = get({ subscribe });
      const allItems = [...state.indices.items, ...state.sectors.items, ...state.commodities.items];
      if (allItems.length === 0) {
        return { marketTrend: "mixed", topGainer: null, topLoser: null };
      }
      const gainers = allItems.filter((i) => i.changePercent > 0);
      const losers = allItems.filter((i) => i.changePercent < 0);
      let marketTrend = "mixed";
      if (gainers.length > losers.length * 1.5) {
        marketTrend = "up";
      } else if (losers.length > gainers.length * 1.5) {
        marketTrend = "down";
      }
      const sorted = [...allItems].sort((a, b) => b.changePercent - a.changePercent);
      const topGainer = sorted[0] ?? null;
      const topLoser = sorted[sorted.length - 1] ?? null;
      return { marketTrend, topGainer, topLoser };
    },
    /**
     * Check if any category is loading
     */
    isAnyLoading() {
      const state = get({ subscribe });
      return state.indices.loading || state.sectors.loading || state.commodities.loading || state.crypto.loading;
    },
    /**
     * Clear all data
     */
    clearAll() {
      set(createInitialState$1());
    }
  };
}
const markets = createMarketsStore();
derived(markets, ($markets) => $markets.indices);
derived(markets, ($markets) => $markets.sectors);
derived(markets, ($markets) => $markets.commodities);
derived(markets, ($markets) => $markets.crypto);
derived(markets, ($markets) => $markets.custom);
derived(
  markets,
  ($markets) => $markets.indices.loading || $markets.sectors.loading || $markets.commodities.loading || $markets.crypto.loading || $markets.custom.loading
);
derived(markets, ($markets) => {
  const times = [
    $markets.indices.lastUpdated,
    $markets.sectors.lastUpdated,
    $markets.commodities.lastUpdated,
    $markets.crypto.lastUpdated,
    $markets.custom.lastUpdated
  ].filter((t) => t !== null);
  return times.length > 0 ? Math.max(...times) : null;
});
derived(markets, ($markets) => {
  return $markets.commodities.items.find((i) => i.symbol === "^VIX") ?? null;
});
function getDefaultSettings() {
  return {
    indices: {
      enabled: INDICES.map((i) => i.symbol),
      order: INDICES.map((i) => i.symbol)
    },
    sectors: {
      enabled: SECTORS.map((s) => s.symbol),
      order: SECTORS.map((s) => s.symbol)
    },
    commodities: {
      enabled: COMMODITIES.map((c) => c.symbol),
      order: COMMODITIES.map((c) => c.symbol)
    },
    crypto: {
      enabled: CRYPTO.map((c) => c.symbol),
      order: CRYPTO.map((c) => c.symbol)
    },
    custom: {
      enabled: [],
      order: []
    }
  };
}
function loadCustomMarkets() {
  return /* @__PURE__ */ new Map();
}
const customMarketsMap = writable(loadCustomMarkets());
const customMarkets = {
  subscribe: customMarketsMap.subscribe,
  add(symbol, name) {
    customMarketsMap.update((m) => {
      m.set(symbol.toUpperCase(), name);
      return new Map(m);
    });
  },
  remove(symbol) {
    customMarketsMap.update((m) => {
      m.delete(symbol.toUpperCase());
      return new Map(m);
    });
  },
  getName(symbol) {
    return get(customMarketsMap).get(symbol.toUpperCase()) || symbol;
  }
};
function cleanSavedSettings(saved) {
  const validSymbols = {
    indices: new Set(INDICES.map((i) => i.symbol)),
    sectors: new Set(SECTORS.map((s) => s.symbol)),
    commodities: new Set(COMMODITIES.map((c) => c.symbol)),
    crypto: new Set(CRYPTO.map((c) => c.symbol))
  };
  const cleaned = {};
  if (saved.indices) {
    cleaned.indices = {
      enabled: (saved.indices.enabled || []).filter((s) => validSymbols.indices.has(s)),
      order: (saved.indices.order || []).filter((s) => validSymbols.indices.has(s))
    };
  }
  if (saved.sectors) {
    cleaned.sectors = {
      enabled: (saved.sectors.enabled || []).filter((s) => validSymbols.sectors.has(s)),
      order: (saved.sectors.order || []).filter((s) => validSymbols.sectors.has(s))
    };
  }
  if (saved.commodities) {
    cleaned.commodities = {
      enabled: (saved.commodities.enabled || []).filter((s) => validSymbols.commodities.has(s)),
      order: (saved.commodities.order || []).filter((s) => validSymbols.commodities.has(s))
    };
  }
  if (saved.crypto) {
    cleaned.crypto = {
      enabled: (saved.crypto.enabled || []).filter((s) => validSymbols.crypto.has(s)),
      order: (saved.crypto.order || []).filter((s) => validSymbols.crypto.has(s))
    };
  }
  return cleaned;
}
function loadFromStorage() {
  return {};
}
function createMarketSettingsStore() {
  const defaults = getDefaultSettings();
  const saved = loadFromStorage();
  const cleanedSaved = cleanSavedSettings(saved);
  const initialSettings = {
    indices: {
      enabled: cleanedSaved.indices?.enabled ?? defaults.indices.enabled,
      order: cleanedSaved.indices?.order ?? defaults.indices.order
    },
    sectors: {
      enabled: cleanedSaved.sectors?.enabled ?? defaults.sectors.enabled,
      order: cleanedSaved.sectors?.order ?? defaults.sectors.order
    },
    commodities: {
      enabled: cleanedSaved.commodities?.enabled ?? defaults.commodities.enabled,
      order: cleanedSaved.commodities?.order ?? defaults.commodities.order
    },
    crypto: {
      enabled: cleanedSaved.crypto?.enabled ?? defaults.crypto.enabled,
      order: cleanedSaved.crypto?.order ?? defaults.crypto.order
    },
    custom: {
      enabled: saved.custom?.enabled ?? defaults.custom.enabled,
      order: saved.custom?.order ?? defaults.custom.order
    }
  };
  const { subscribe, set, update } = writable(initialSettings);
  let currentSettings = initialSettings;
  subscribe((value) => {
    currentSettings = value;
  });
  return {
    subscribe,
    /**
     * Toggle market visibility
     */
    toggleMarket(category, symbol) {
      update((settings2) => {
        const categorySettings = settings2[category];
        const index = categorySettings.enabled.indexOf(symbol);
        if (index > -1) {
          categorySettings.enabled.splice(index, 1);
        } else {
          categorySettings.enabled.push(symbol);
        }
        return settings2;
      });
    },
    /**
     * Reorder markets
     */
    reorderMarkets(category, newOrder) {
      update((settings2) => {
        settings2[category].order = newOrder;
        return settings2;
      });
    },
    /**
     * Reset to defaults
     */
    reset() {
      const defaults2 = getDefaultSettings();
      set(defaults2);
    },
    /**
     * Get enabled and sorted markets for a category
     */
    getOrderedMarkets(category) {
      const categorySettings = currentSettings[category];
      return categorySettings.order.filter(
        (symbol) => categorySettings.enabled.includes(symbol)
      );
    },
    /**
     * Add a custom market
     */
    addCustomMarket(symbol, name) {
      const upperSymbol = symbol.toUpperCase();
      customMarkets.add(upperSymbol, name);
      update((settings2) => {
        if (!settings2.custom.order.includes(upperSymbol)) {
          settings2.custom.order.push(upperSymbol);
          settings2.custom.enabled.push(upperSymbol);
        }
        return settings2;
      });
    },
    /**
     * Remove a custom market
     */
    removeCustomMarket(symbol) {
      const upperSymbol = symbol.toUpperCase();
      customMarkets.remove(upperSymbol);
      update((settings2) => {
        settings2.custom.order = settings2.custom.order.filter((s) => s !== upperSymbol);
        settings2.custom.enabled = settings2.custom.enabled.filter((s) => s !== upperSymbol);
        return settings2;
      });
    }
  };
}
createMarketSettingsStore();
const REFRESH_STAGES = [
  {
    name: "critical",
    categories: ["news", "markets", "alerts"],
    delayMs: 0
  },
  {
    name: "secondary",
    categories: ["crypto", "commodities", "intel"],
    delayMs: 2e3
  },
  {
    name: "tertiary",
    categories: ["contracts", "whales", "layoffs", "polymarket"],
    delayMs: 4e3
  }
];
const DEFAULT_AUTO_REFRESH_INTERVAL = 60 * 60 * 1e3;
function loadSettings() {
  {
    return {
      autoRefreshEnabled: true,
      autoRefreshInterval: DEFAULT_AUTO_REFRESH_INTERVAL,
      lastRefresh: null
    };
  }
}
function saveSettings(enabled, interval, lastRefresh2) {
  return;
}
function createInitialState() {
  const settings2 = loadSettings();
  return {
    isRefreshing: false,
    currentStage: null,
    lastRefresh: settings2.lastRefresh,
    categoryStates: {},
    autoRefreshEnabled: settings2.autoRefreshEnabled,
    autoRefreshInterval: settings2.autoRefreshInterval,
    refreshHistory: [],
    initialized: false
  };
}
function createRefreshStore() {
  const { subscribe, set, update } = writable(createInitialState());
  let refreshStartTime = null;
  function setupAutoRefresh(callback) {
    const state = get({ subscribe });
    if (state.autoRefreshEnabled && browser) ;
  }
  return {
    subscribe,
    /**
     * Initialize store
     */
    init() {
      update((state) => ({ ...state, initialized: true }));
    },
    /**
     * Start a refresh cycle
     */
    startRefresh() {
      refreshStartTime = Date.now();
      update((state) => ({
        ...state,
        isRefreshing: true,
        currentStage: "critical"
      }));
    },
    /**
     * Move to the next stage
     */
    nextStage() {
      update((state) => {
        const currentIndex = REFRESH_STAGES.findIndex((s) => s.name === state.currentStage);
        const nextStage = REFRESH_STAGES[currentIndex + 1];
        return {
          ...state,
          currentStage: nextStage?.name ?? null
        };
      });
    },
    /**
     * End refresh cycle
     */
    endRefresh(errors = []) {
      const duration = refreshStartTime ? Date.now() - refreshStartTime : 0;
      refreshStartTime = null;
      const now = Date.now();
      update((state) => {
        const historyEntry = {
          timestamp: now,
          duration,
          success: errors.length === 0,
          errors
        };
        const newHistory = [historyEntry, ...state.refreshHistory].slice(0, 10);
        saveSettings(state.autoRefreshEnabled, state.autoRefreshInterval);
        return {
          ...state,
          isRefreshing: false,
          currentStage: null,
          lastRefresh: now,
          refreshHistory: newHistory
        };
      });
    },
    /**
     * Set loading state for a category
     */
    setCategoryLoading(category, loading) {
      update((state) => ({
        ...state,
        categoryStates: {
          ...state.categoryStates,
          [category]: {
            ...state.categoryStates[category],
            loading,
            error: loading ? null : state.categoryStates[category]?.error ?? null,
            lastUpdated: state.categoryStates[category]?.lastUpdated ?? null
          }
        }
      }));
    },
    /**
     * Set category updated
     */
    setCategoryUpdated(category) {
      update((state) => ({
        ...state,
        categoryStates: {
          ...state.categoryStates,
          [category]: {
            loading: false,
            error: null,
            lastUpdated: Date.now()
          }
        }
      }));
    },
    /**
     * Set category error
     */
    setCategoryError(category, error) {
      update((state) => ({
        ...state,
        categoryStates: {
          ...state.categoryStates,
          [category]: {
            ...state.categoryStates[category],
            loading: false,
            error,
            lastUpdated: state.categoryStates[category]?.lastUpdated ?? null
          }
        }
      }));
    },
    /**
     * Toggle auto-refresh
     */
    toggleAutoRefresh(callback) {
      update((state) => {
        const newEnabled = !state.autoRefreshEnabled;
        saveSettings(newEnabled, state.autoRefreshInterval);
        if (callback) {
          setupAutoRefresh();
        }
        return {
          ...state,
          autoRefreshEnabled: newEnabled
        };
      });
    },
    /**
     * Set auto-refresh interval
     */
    setAutoRefreshInterval(intervalMs, callback) {
      update((state) => {
        saveSettings(state.autoRefreshEnabled);
        if (callback) {
          setupAutoRefresh();
        }
        return {
          ...state,
          autoRefreshInterval: intervalMs
        };
      });
    },
    /**
     * Setup auto-refresh with callback
     */
    setupAutoRefresh(callback) {
      setupAutoRefresh();
    },
    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
    },
    /**
     * Get time since last refresh
     */
    getTimeSinceRefresh() {
      const state = get({ subscribe });
      if (!state.lastRefresh) return null;
      return Date.now() - state.lastRefresh;
    },
    /**
     * Check if a category needs refresh
     */
    categoryNeedsRefresh(category, maxAge) {
      const state = get({ subscribe });
      const categoryState = state.categoryStates[category];
      if (!categoryState?.lastUpdated) return true;
      return Date.now() - categoryState.lastUpdated > maxAge;
    },
    /**
     * Reset store
     */
    reset() {
      set(createInitialState());
    }
  };
}
const refresh = createRefreshStore();
derived(refresh, ($refresh) => $refresh.isRefreshing);
derived(refresh, ($refresh) => $refresh.currentStage);
derived(refresh, ($refresh) => $refresh.lastRefresh);
derived(refresh, ($refresh) => $refresh.autoRefreshEnabled);
derived(refresh, ($refresh) => {
  if (!$refresh.lastRefresh) return null;
  return Date.now() - $refresh.lastRefresh;
});
derived(refresh, ($refresh) => {
  return Object.entries($refresh.categoryStates).filter(([, state]) => state.error !== null).map(([category, state]) => ({ category, error: state.error }));
});
function createFedIndicatorsStore() {
  const { subscribe, update } = writable({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });
  return {
    subscribe,
    setLoading(loading) {
      update((state) => ({
        ...state,
        loading,
        error: loading ? null : state.error
      }));
    },
    setError(error) {
      update((state) => ({
        ...state,
        loading: false,
        error
      }));
    },
    setData(data) {
      update(() => ({
        data,
        loading: false,
        error: null,
        lastUpdated: Date.now()
      }));
    }
  };
}
const fedIndicators = createFedIndicatorsStore();
function createFedNewsStore() {
  const { subscribe, update } = writable({
    items: [],
    loading: false,
    error: null,
    lastUpdated: null
  });
  return {
    subscribe,
    setLoading(loading) {
      update((state) => ({
        ...state,
        loading,
        error: loading ? null : state.error
      }));
    },
    setError(error) {
      update((state) => ({
        ...state,
        loading: false,
        error
      }));
    },
    setItems(items) {
      update(() => ({
        items,
        loading: false,
        error: null,
        lastUpdated: Date.now()
      }));
    }
  };
}
const fedNews = createFedNewsStore();
derived(
  [fedIndicators, fedNews],
  ([$indicators, $news]) => $indicators.loading || $news.loading
);
derived(fedNews, ($news) => $news.items.filter((item) => item.hasVideo));
function createSelectedCountryStore() {
  const { subscribe, set } = writable({
    name: null
  });
  return {
    subscribe,
    /**
     * Select a country by name
     */
    select(name, code, latitude, longitude) {
      set({
        name,
        code,
        latitude,
        longitude
      });
    },
    /**
     * Clear the selected country
     */
    clear() {
      set({
        name: null
      });
    }
  };
}
createSelectedCountryStore();
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    function isPanelVisible(id) {
      return store_get($$store_subs ??= {}, "$settings", settings).enabled[id] !== false;
    }
    store_get($$store_subs ??= {}, "$settings", settings).order.filter((id) => id !== "map" && isPanelVisible(id));
    head("1uha8ag", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Situation Monitor</title>`);
      });
      $$renderer3.push(`<meta name="description" content="Real-time global situation monitoring dashboard" class="svelte-1uha8ag"/>`);
    });
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="loading-screen svelte-1uha8ag"><div class="loading-content svelte-1uha8ag"><div class="logo-container svelte-1uha8ag"><div class="radar-circle svelte-1uha8ag"></div> <div class="radar-circle radar-circle-2 svelte-1uha8ag"></div> <div class="radar-circle radar-circle-3 svelte-1uha8ag"></div> <div class="radar-sweep svelte-1uha8ag"></div></div> <h1 class="loading-title svelte-1uha8ag">SITUATION MONITOR</h1> <div class="loading-dots svelte-1uha8ag"><span class="dot svelte-1uha8ag"></span> <span class="dot svelte-1uha8ag"></span> <span class="dot svelte-1uha8ag"></span></div></div></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
