# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Workflow

When working on a new feature:
1. Create a new branch before making any changes
2. Make all commits on that feature branch
3. Before opening a PR, run the `code-simplifier` agent to clean up the code

## Build & Development Commands

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

## Technology Stack

- **SvelteKit 2.0** with Svelte 5 reactivity (`$state`, `$derived`, `$effect` runes)
- **TypeScript** (strict mode enabled)
- **Tailwind CSS** with custom dark theme
- **Vitest** (unit) + **Playwright** (E2E) for testing
- **Static adapter** - deploys as pure static site to GitHub Pages

## Project Architecture

### Core Directories (`src/lib/`)

- **`analysis/`** - Pattern correlation, narrative tracking, main character detection across news items
- **`api/`** - Data fetching from GDELT, RSS feeds, market APIs, CoinGecko
- **`components/`** - Svelte components organized into layout/, panels/, modals/, common/
- **`config/`** - Centralized configuration for feeds, keywords, analysis patterns, panels, map hotspots
- **`services/`** - Resilience layer: CacheManager, CircuitBreaker, RequestDeduplicator, ServiceClient
- **`stores/`** - Svelte stores for settings, news, markets, monitors, refresh orchestration
- **`types/`** - TypeScript interfaces

### Routes and Entity Pages

- `/` - overview: status strip, map, sortable entity table, news tape
- `/e/[type]/[id]` - one prerendered page per entity (region, topic, narrative, asset, person); `entries()` in its `+page.ts` enumerates them from the registry
- `/dashboard` - the original panel grid
- Data loading lives in `src/lib/services/dataLoader.ts`, started once from the root layout
- `src/lib/config/entities.ts` is the entity registry, built from the map, analysis, markets and leaders config. `src/lib/analysis/entity-index.ts` indexes current headlines by entity; entity page sections read from it
- Terminal view components are in `src/lib/components/terminal/`, styled by `src/lib/styles/terminal.css` (the accent colour is the single `--t-accent` token)

### Path Aliases

```typescript
$lib        → src/lib
$components → src/lib/components
$stores     → src/lib/stores
$services   → src/lib/services
$config     → src/lib/config
$types      → src/lib/types
```

## Key Architectural Patterns

### Service Layer (`src/lib/services/`)
All HTTP requests go through `ServiceClient` which integrates:
- **CacheManager**: Per-service caching with TTL
- **CircuitBreaker**: Prevents cascading failures
- **RequestDeduplicator**: Prevents concurrent duplicate requests

### Multi-Stage Refresh (`src/lib/stores/refresh.ts`)
Data fetches happen in 3 stages with staggered delays:
1. Critical (0ms): News, markets, alerts
2. Secondary (2s): Crypto, commodities, intel
3. Tertiary (4s): Contracts, whales, layoffs, polymarket

### Analysis Engine (`src/lib/analysis/`)
Unique business logic for intelligence analysis:
- Correlation detection across disparate news items
- Narrative tracking (fringe → mainstream progression)
- Entity prominence calculation ("main character" analysis)
- All use configurable regex patterns from `src/lib/config/analysis.ts`

### Configuration-Driven Design (`src/lib/config/`)
- `feeds.ts`: RSS sources across 6 categories (politics, tech, finance, gov, ai, intel)
- `keywords.ts`: Alert keywords, region detection, topic detection
- `analysis.ts`: Correlation topics and narrative patterns with severity levels
- `panels.ts`: Panel registry with display order
- `map.ts`: Geopolitical hotspots, conflict zones, strategic locations

## Testing

**Unit tests**: Located alongside source as `*.test.ts` or `*.spec.ts`
**E2E tests**: In `tests/e2e/*.spec.ts`, run against preview server

## Deployment

GitHub Actions workflow builds with `BASE_PATH=/situation-monitor` and deploys to GitHub Pages at `https://hipcityreg.github.io/situation-monitor/`

## External Dependencies

- **D3.js** for interactive map visualization
- **CORS proxy** (Cloudflare Worker) for RSS feed parsing
- **CoinGecko API** for cryptocurrency data
