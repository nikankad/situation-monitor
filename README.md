# Situation Monitor

A real-time intelligence dashboard that aggregates and analyzes news, markets, and geopolitical events from multiple sources to provide a comprehensive situational awareness platform.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![SvelteKit](https://img.shields.io/badge/SvelteKit-2.0-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## 🌟 Features

### 📰 Intelligence Aggregation
- **Multi-Source News**: Aggregates from 30+ RSS feeds across 6 categories (politics, tech, finance, government, AI, intelligence)
- **Real-Time Updates**: Multi-stage refresh system with staggered data fetching
- **Custom Monitors**: Create keyword-based monitors with custom alerting thresholds

### 🔍 Advanced Analysis
- **Correlation Detection**: Identifies patterns and connections across disparate news items
- **Narrative Tracking**: Monitors story progression from fringe to mainstream sources
- **Main Character Analysis**: Detects and tracks prominent entities and figures in current events
- **Keyword Alerts**: Configurable alerts for specific terms, regions, and topics

### 📊 Market Intelligence
- **Stock Markets**: Real-time tracking of major indices (S&P 500, NASDAQ, Dow Jones, VIX)
- **Cryptocurrency**: Live prices and tracking for major cryptocurrencies via CoinGecko
- **Commodities**: Gold, silver, oil, and other commodity price monitoring
- **Federal Reserve**: Economic indicators and Fed news integration
- **Market Heatmap**: Visual representation of market performance

### 🌍 Geopolitical Monitoring
- **Interactive World Map**: D3.js-powered map with geopolitical hotspots and conflict zones
- **World Leaders Tracker**: Monitor statements and actions from global leaders
- **Regional Analysis**: Country-specific intelligence and regional trend detection
- **Strategic Locations**: Pre-configured hotspots for areas of geopolitical importance

### 💰 Financial Tracking
- **Whale Transactions**: Monitor large cryptocurrency transactions
- **Government Contracts**: Track federal contract awards
- **Polymarket Predictions**: Integration with prediction markets
- **Layoff Tracker**: Monitor workforce reductions across industries

### 🛡️ Resilience & Performance
- **Circuit Breaker**: Prevents cascading failures in data fetching
- **Request Deduplication**: Eliminates concurrent duplicate requests
- **Smart Caching**: Per-service caching with configurable TTL
- **Multi-Stage Refresh**: Prioritized data loading (Critical → Secondary → Tertiary)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/nikankad/situation-monitor.git
cd situation-monitor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 📋 Development Commands

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Build to /build directory
npm run preview      # Preview production build (localhost:4173)
npm run check        # TypeScript type checking
npm run check:watch  # Type checking in watch mode
npm run test         # Run Vitest in watch mode
npm run test:unit    # Run unit tests once
npm run test:e2e     # Run Playwright E2E tests (requires preview server)
npm run lint         # ESLint + Prettier check
npm run format       # Auto-format with Prettier
```

## 🏗️ Technology Stack

- **Framework**: SvelteKit 2.0 with Svelte 5 (using modern `$state`, `$derived`, `$effect` runes)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS with custom dark theme
- **Visualization**: D3.js for interactive maps and charts
- **Testing**: Vitest (unit tests) + Playwright (E2E tests)
- **Deployment**: Static adapter for GitHub Pages deployment

## 📁 Project Architecture

### Directory Structure
```
src/lib/
├── analysis/      # Pattern correlation, narrative tracking, entity detection
├── api/           # Data fetching (GDELT, RSS feeds, markets, CoinGecko)
├── components/    # Svelte components (layout, panels, modals, common)
├── config/        # Centralized configuration (feeds, keywords, patterns)
├── services/      # Resilience layer (CacheManager, CircuitBreaker, etc.)
├── stores/        # Svelte stores (settings, news, markets, monitors)
├── types/         # TypeScript interfaces
└── utils/         # Utility functions
```

### Key Components

#### Service Layer (`src/lib/services/`)
All HTTP requests go through `ServiceClient` which provides:
- **CacheManager**: Per-service caching with TTL
- **CircuitBreaker**: Automatic failure detection and recovery
- **RequestDeduplicator**: Prevents concurrent duplicate requests

#### Multi-Stage Refresh System
Data fetches occur in 3 prioritized stages:
1. **Critical (0ms)**: News, markets, alerts
2. **Secondary (2s)**: Crypto, commodities, intel
3. **Tertiary (4s)**: Contracts, whales, layoffs, polymarket

#### Analysis Engine (`src/lib/analysis/`)
Unique intelligence analysis features:
- Correlation detection across news items
- Narrative tracking (fringe → mainstream progression)
- Entity prominence calculation ("main character" detection)
- Configurable regex patterns for topic matching

#### Configuration-Driven Design (`src/lib/config/`)
- `feeds.ts`: 30+ RSS sources across 6 categories
- `keywords.ts`: Alert keywords, region detection, topic detection
- `analysis.ts`: Correlation topics and narrative patterns
- `panels.ts`: Panel registry with display order
- `map.ts`: Geopolitical hotspots and strategic locations

### Path Aliases
```typescript
$lib        → src/lib
$components → src/lib/components
$stores     → src/lib/stores
$services   → src/lib/services
$config     → src/lib/config
$types      → src/lib/types
```

## 🧪 Testing

- **Unit Tests**: Located alongside source files as `*.test.ts` or `*.spec.ts`
- **E2E Tests**: In `tests/e2e/*.spec.ts`, run against preview server
- **Coverage**: Run `npm run test:unit` for unit test coverage

## 🚀 Deployment

The project is configured for static deployment to GitHub Pages:

1. Build the project:
```bash
npm run build
```

2. The site is automatically deployed via GitHub Actions to:
   `https://hipcityreg.github.io/situation-monitor/`

The build process uses `BASE_PATH=/situation-monitor` for proper asset routing on GitHub Pages.

## 🔧 Configuration

### Adding News Sources
Edit `src/lib/config/feeds.ts` to add new RSS feeds:
```typescript
export const FEEDS: Record<NewsCategory, FeedSource[]> = {
  politics: [
    { name: 'Source Name', url: 'https://example.com/feed.xml' }
  ]
};
```

### Configuring Alerts
Edit `src/lib/config/keywords.ts` to customize alert keywords:
```typescript
export const ALERT_KEYWORDS = [
  'keyword1',
  'keyword2'
];
```

### Adding Analysis Patterns
Edit `src/lib/config/analysis.ts` to add correlation topics:
```typescript
export const CORRELATION_TOPICS: CorrelationTopic[] = [
  {
    id: 'topic-id',
    patterns: [/pattern1/i, /pattern2/i],
    category: 'Category'
  }
];
```

## 🌐 External Dependencies

- **D3.js**: Interactive map visualization and data charts
- **CORS Proxy**: Cloudflare Worker for RSS feed parsing (handles CORS restrictions)
- **CoinGecko API**: Cryptocurrency price data
- **GDELT**: Global news event database

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm run lint && npm run test:unit`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- News data aggregated from various public RSS feeds
- Market data provided by CoinGecko and other financial APIs
- Map visualizations powered by D3.js and TopoJSON
- Built with SvelteKit and the Svelte ecosystem

---

**Note**: This is an intelligence aggregation and analysis tool designed for situational awareness. Always verify critical information from primary sources.
