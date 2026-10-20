# ML Signal Engine: Design Plan

Status: draft for review. No code yet.

## Decisions so far

| Question | Decision |
| --- | --- |
| Signals | All four: market direction, geopolitical risk, anomaly, news ranking |
| Model | **One multi-task neural network** producing all four outputs, from day one |
| Freshness | Hourly/daily batch |
| Hosting | Small VPS (about $5-40/month) |
| Audience | Personal research tool |

All four signals come from one network. Phase 1 builds the data foundation it trains on, and phase 2 trains it. Each output is still validated and published on its own (see Evaluation), so a weak output can be hidden without touching the others.

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
5. **Be honest about expectations.** Predicting liquid-market returns from public news is very hard and the edge is usually small or zero. The geopolitical-risk and ranking outputs have a better chance of being useful. The backtest framework has to be able to say "no signal".

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

## Model: one multi-task network

One network and one saved artifact. It reads the feature row for an entity (region, topic or asset) at time T and returns every output at once.

```
feature row ──────┐
text embeddings ──┼─► shared encoder ─► shared representation ─┬─► risk        P(escalation in 7d)
entity + time ────┘   (MLP first,         (64-256 dims)         ├─► direction   P(up) at 1d, 5d + vol bucket
                       temporal layer                           ├─► anomaly     reconstruction error
                       later)                                   └─► importance  ranking score
```

| Output | Loss | Label source | Primary metric |
| --- | --- | --- | --- |
| Geopolitical risk | Binary cross-entropy | ACLED / GDELT conflict-event surge in the next 7d | PR-AUC, Brier score |
| Market direction | Binary cross-entropy per horizon, plus cross-entropy on a volatility bucket | Price history | AUC, and a simple rule's return after costs |
| Anomaly | Reconstruction error of a decoder branch, no labels | None | Precision@k against known events and your reviews |
| News importance | Pairwise ranking loss | Your thumbs up/down, plus proxy labels (cross-source pickup, later market or event moves) | NDCG@k |

Training rules:

- **Masked loss.** A row only contributes to the outputs it has a label for. The last 7 days have no risk label yet, and few items have thumbs.
- **Loss weighting.** Start with learned uncertainty weighting. The market-direction output gets a low weight, and if an ablation shows it hurts the others, its gradient is detached from the shared encoder.
- **Entity embeddings** for region and asset ids, so one network serves every entity.
- **Small and regularized.** Dropout, weight decay, early stopping on the walk-forward validation fold, and an average over about 5 seeds, which also gives an uncertainty estimate. It trains on CPU in minutes at this data size.
- **Frozen text encoder.** Text embeddings come from a small open sentence-embedding model and are not fine-tuned.
- **Missing sources.** Only some sources can be backfilled (GDELT yes, RSS no). Feature groups are randomly dropped during training and carry a "missing" indicator, so the network works both with and without them.
- **Framework:** PyTorch.

Comparators (never shipped, always reported next to the network): the naive baseline for each output, and a per-output LightGBM trained on the same walk-forward folds. They show whether the network learned anything beyond a cheap tree. If a tree beats the network on an output, we investigate before trusting that output.

Explanations: the "top features" in `signals.json` are feature families (volume, sentiment, conflict, market, and so on), scored by integrated gradients and checked with permutation importance in the backtest.

## Evaluation

- **Walk-forward only.** Expanding or rolling window: train on [0, t), validate on [t, t+h), step forward. Never a random split.
- **Purging and embargo** around the label horizon so overlapping labels don't leak across the split.
- **Baselines are mandatory** and reported next to every model result.
- **Costs and turnover** are included for any trading-style metric.
- **Calibration** is checked for probability outputs, because the UI will show probabilities.
- **Multiple-testing discipline:** keep a log of every experiment tried, and hold out the most recent period untouched until a final check.
- **Per-output gate.** Each output must beat its naive baseline out of sample before it is shown. An output that fails is displayed as "no validated signal" and does not block the others. A new network version replaces the live one only if no output gets worse and at least one improves.
- **Paper-trade period:** before trusting any output, score live for a few weeks and compare with the backtest.

## Serving and UI

- A scoring job runs after each ingestion cycle and writes `signals.json` (per output, with score, confidence, top contributing features and model version).
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

**Phase 1: Start collecting.** `ml/` scaffold, RSS + GDELT + one market source ingestion, raw Parquet store, DuckDB, freshness monitoring, nightly backup. GDELT backfill job: as many years of events and GKG themes/tone as storage allows, plus price history for the asset list, because the network needs history from the start. Exit criterion: two weeks of clean, timestamped data with no unexplained gaps.

**Phase 2: First honest backtest.** Point-in-time feature pipeline, walk-forward harness, naive baselines and per-output LightGBM comparators, then the multi-task network. Exit criterion: at least one output beats its baseline out of sample, or we have a documented "no signal" result and change the targets or features.

**Phase 3: Publish and widen.** Scoring job, `signals.json`, Signals panel in the UI, with per-output validation badges. Add phase 2 sources one at a time with ablations, retraining the network each time.

**Phase 4: Feedback loop.** Thumbs up/down in the UI feeding the importance output. Richer embedding features. Add a temporal layer to the encoder if the plain MLP plateaus.

## Open questions

1. Which assets and regions are the first targets? (Suggested: SPY, BTC, WTI crude, gold and 5-8 regions already in `config/map.ts`.)
2. Which market data source? Needs acceptable terms for storing history.
3. VPS provider and region. Any provider with 2-4 GB RAM and 40+ GB disk works at phase 1 scale.
4. Should the Python code live in this repo (`ml/`) or in a separate one? The recommendation is the same repo, to keep feature-parity tests simple, with its own CI job.
5. Embedding model: run locally on the VPS CPU (fine at batch cadence) or rent GPU time only for occasional re-embedding?
6. How many seeds and what weighting scheme for the network? The defaults above (5 seeds, uncertainty weighting) are a starting point to tune in phase 2.
