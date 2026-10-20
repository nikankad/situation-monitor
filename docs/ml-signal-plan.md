# ML Signal Engine: Design Plan

Status: draft for review. No code yet.

## Decisions so far

| Question | Decision |
| --- | --- |
| Signals | All four, as separate heads on one shared pipeline: market direction, geopolitical risk, anomaly, news ranking |
| Freshness | Hourly/daily batch |
| Hosting | Small VPS (about $5-40/month) |
| Audience | Personal research tool |

The four signals do not ship together. They share ingestion, storage and features, so phase 1 builds that foundation and one head, and the other heads come in later phases.

## Starting point

- The app is a static SvelteKit site on GitHub Pages (`deploy.yml`). The `vercel.json` is stray. It runs entirely in the browser, with a Cloudflare Worker as a CORS proxy.
- There is **no backend and no history**. Everything is cached for about 5 minutes. `docs/ROADMAP.md` already lists "persistent historical database" and "news → market correlation" under future work.
- Existing sources: about 25 RSS feeds in 6 categories (`config/feeds.ts`), GDELT (news and conflicts), Finnhub, CoinGecko, Polymarket.
- Existing analysis in `src/lib/analysis/` is regex-driven: correlation, narrative, sentiment, main character. It becomes feature code and the baseline model. It is not thrown away.

## Hard constraints

1. **Point-in-time correctness.** Every raw record stores `observed_at` (when we fetched it), `published_at` (when the source says it happened) and `available_at` (the later of the two, adjusted for known source delays). Features for a prediction made at time T may only use records with `available_at <= T`. Lookahead leakage is the usual reason these models look great in backtests and fail live.
2. **RSS has no history.** It can't be backfilled, so ingestion starts first, before any model exists. Every day without storage is training data lost.
3. **Backfillable sources.** GDELT has historical archives. Free market APIs give limited history, and their terms often restrict storage and redistribution. Check terms per source (see Sources).
4. **Start narrow.** The "huge amount of sources" goal is phase 3. Phase 1 is a few sources, one target and a backtest that beats a naive baseline.
5. **Be honest about expectations.** Predicting liquid-market returns from public news is very hard and the edge is usually small or zero. The geopolitical-risk and ranking heads have a better chance of being useful. The backtest framework has to be able to say "no signal".

## Architecture

```
 sources ──► ingest workers ──► raw store (append-only) ──► feature jobs ──► feature store
 (RSS, GDELT,    (Python,           Parquet + DuckDB,          (point-in-time      │
  markets,        cron on VPS)      with *_at timestamps)       joins)             ▼
  ACLED, ...)                                                          training / backtest
                                                                              │
 SvelteKit UI ◄── static JSON / small read-only API ◄── signal publisher ◄── scoring job
 (GitHub Pages)       (served from VPS)                                    (hourly/daily)
```

### Ingestion (Python service, new `ml/` directory)

- Python, because the ML ecosystem lives there. The SvelteKit app stays as the terminal UI.
- One small adapter per source, behind a shared interface: `fetch() -> list[RawRecord]`. Adapters are idempotent and dedupe on a content hash.
- Scheduled with cron or systemd timers on the VPS. A worker framework adds nothing at hourly/daily cadence.
- Raw payloads are saved untouched, then normalized, so parsing bugs can be fixed by reprocessing.
- Retry and circuit-breaker ideas from `src/lib/services/` carry over conceptually. The implementation is rewritten in Python.

### Storage

- **Raw store:** append-only Parquet files partitioned by source and date.
- **Query layer:** DuckDB over the Parquet files. It is a single file, needs no server, and handles this scale (millions of rows) easily.
- **Postgres/Timescale is deferred.** Add it only if you need concurrent writers or a multi-user API. The recommendation is to start with files, since a VPS gives you disk and cron and the audience is one person.
- **Backups:** nightly sync to object storage (R2 or B2). The history is the irreplaceable asset.

### Sources (phased)

| Phase | Sources | Backfill | Notes |
| --- | --- | --- | --- |
| 1 | Existing RSS feeds, GDELT events + GKG, one market data source for a small asset list | GDELT: yes, markets: limited | Pick the market source for stored-data terms, not just the free tier |
| 2 | ACLED, CISA KEV, ReliefWeb, USASpending, Polymarket, CoinGecko | ACLED and ReliefWeb: yes | Roadmap items already |
| 3 | Reddit/Telegram/social, filings (SEC EDGAR), OpenSky, shipping, central bank text | Mixed | Each new source must justify itself by backtest lift |

Rule: a source is kept only if ablating it makes a backtest metric worse.

### Feature pipeline

- **Text:** per-item sentiment, entities, topics. Start from the existing regex logic, then add embeddings from a small open model (for example a MiniLM-class sentence encoder). No LLM calls per article at this volume and cost.
- **Aggregates:** per region, topic and asset, over rolling windows (1h, 6h, 24h, 7d): volume, z-scored volume, sentiment mean and delta, source-diversity, narrative stage (fringe to mainstream, from `narrative.ts`).
- **Cross-source:** GDELT event counts and Goldstein scale, ACLED fatalities, Polymarket odds moves, market volatility.
- Features are versioned. A feature definition change creates a new version, never edits history.
- The existing TypeScript analysis stays in the UI for live display. The Python port is the one used for training, so there is a single source of truth for training features. A parity test compares the two on a fixed fixture set.

## Signal heads

| Head | Target (label) | Label source | Model ladder | Primary metric |
| --- | --- | --- | --- | --- |
| **Market direction** | Sign of forward return and realized-vol bucket, per asset, at 1d and 5d | Price history | Naive (previous direction / vol persistence) → logistic regression → LightGBM | Out-of-sample AUC and Sharpe of a simple rule after costs, vs. baseline |
| **Geopolitical risk** | Probability of an escalation event in the next 7d per region (ACLED/GDELT conflict-event surge) | ACLED / GDELT | Naive (trailing event rate) → logistic regression → LightGBM | PR-AUC, calibration (Brier score) |
| **Anomaly** | "Unusual" level per topic/region, no label | None | Rolling z-score / STL residual → isolation forest → autoencoder over embeddings | Backtested against known events; precision@k of alerts you judge useful |
| **News ranking** | Item importance | Your own thumbs up/down in the UI, plus proxy labels (cross-source pickup, later market or event moves) | Heuristic score → logistic regression on features → pairwise ranker | NDCG@k on held-out feedback |

General ladder rule: a more complex model is only adopted if it beats the previous rung out of sample. Gradient-boosted trees on tabular features are expected to be the workhorse. Deep sequence models are a phase 4 option, not a starting point.

## Evaluation

- **Walk-forward only.** Expanding or rolling window: train on [0, t), validate on [t, t+h), step forward. Never a random split.
- **Purging and embargo** around the label horizon so overlapping labels don't leak across the split.
- **Baselines are mandatory** and reported next to every model result.
- **Costs and turnover** are included for any trading-style metric.
- **Calibration** is checked for probability outputs, because the UI will show probabilities.
- **Multiple-testing discipline:** keep a log of every experiment tried, and hold out the most recent period untouched until a final check.
- **Paper-trade period:** before trusting any head, score live for a few weeks and compare with the backtest.

## Serving and UI

- A scoring job runs after each ingestion cycle and writes `signals.json` (per head, with score, confidence, top contributing features and model version).
- The VPS serves it as static JSON behind a small read-only endpoint (Caddy/nginx), and the SvelteKit frontend adds a "Signals" panel through the existing panel registry and `ServiceClient`. Keeping the app static avoids an app-server rewrite.
- Each signal shows its backtest metrics and a "last validated" date, so you can see when a model has gone stale.
- A FastAPI service is the upgrade path if the UI later needs queries beyond static JSON.

## Operations

- Model registry: a versioned directory of model artifacts plus a metrics JSON. No MLflow until it hurts.
- Monitoring: data freshness per source, row-count drift, feature distribution drift, and rolling live-vs-backtest metric. An alert when a source goes quiet, since silent source failures corrupt features.
- Retraining: scheduled (for example weekly), with a promotion gate that requires beating the current model on the walk-forward metric.
- Secrets in environment files on the VPS, not in the repo.

## Phased milestones

**Phase 0: Decisions (this doc).** Confirm the market asset list, the VPS provider, and the market data source and its storage terms.

**Phase 1: Start collecting.** `ml/` scaffold, RSS + GDELT + one market source ingestion, raw Parquet store, DuckDB, freshness monitoring, nightly backup. GDELT backfill job. Exit criterion: two weeks of clean, timestamped data with no unexplained gaps.

**Phase 2: First honest backtest.** Point-in-time feature pipeline, walk-forward harness, baselines, then logistic regression and LightGBM for the market-direction and geopolitical-risk heads. Exit criterion: either a head beats its baseline out of sample, or we have a documented "no signal" result and change the target or features.

**Phase 3: Publish and widen.** Scoring job, `signals.json`, Signals panel in the UI. Add phase 2 sources one at a time with ablations. Add the anomaly head.

**Phase 4: Feedback loop.** Thumbs up/down in the UI feeding the news-ranking head. Embedding features. Consider sequence models only if tree models plateau.

## Open questions

1. Which assets and regions are the first targets? (Suggested: SPY, BTC, WTI crude, gold and 5-8 regions already in `config/map.ts`.)
2. Which market data source? Needs acceptable terms for storing history.
3. VPS provider and region. Any provider with 2-4 GB RAM and 40+ GB disk works at phase 1 scale.
4. Should the Python code live in this repo (`ml/`) or in a separate one? The recommendation is the same repo, to keep feature-parity tests simple, with its own CI job.
5. Embedding model: run locally on the VPS CPU (fine at batch cadence) or rent GPU time only for occasional re-embedding?
