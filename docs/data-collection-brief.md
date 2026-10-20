# Data collection brief

Briefing for the Claude Code session running on the VPS. Read `docs/ml-signal-plan.md` first for the overall design. This file is the instruction set for the data part only. Nothing else (models, UI) is in scope yet.

## Goal

Collect free data from public sources and build a point-in-time-correct dataset with train, validation, test and live-forward splits. Two jobs:

1. **Backfill (run once, resumable):** years of history, to build the train, validation and test sets.
2. **Live ingestion (every hour, from now on):** starts immediately, because RSS has no history and every day not stored is lost.

The visual map is at https://claude.ai/artifact/HycMZd5CnF8yjCgxE6ewvD (owner only).

## Ground rules

- **Do not invent data.** If a source is unreachable, an API shape differs from this brief, or a quota blocks you, stop and report it. Never fill gaps with mocked or placeholder values.
- **Verify before coding.** URLs, parameters and schemas below come from memory and web searches, and free-tier terms change. Read the live documentation for each source and trust it over this file. Say where they differ.
- **Free sources only.** No paid vendor. Personal research use.
- **Follow the repo's `CLAUDE.md`:** work on a new branch off `plan/ml-signal-model` (for example `data/ingestion`), commit there, and do not open a PR unless asked.
- **No secrets in the repo.** Keys go in `/etc/situation-monitor.env` or a `.env` that is git-ignored.
- **Be polite to sources:** descriptive `User-Agent`, timeouts, retries with backoff, no more than hourly polling for live sources.
- **Everything idempotent and resumable.** Re-running a job must not duplicate rows. Backfills must continue where they stopped.
- **Tests on small fixtures** for parsers and the timestamp rules. Run them before committing.

## Stack

Python 3.12 with `uv`, `httpx`, `tenacity`, `feedparser`, `pydantic`, `pyarrow`, `duckdb`, `google-cloud-bigquery`, `structlog`. Scheduling with systemd timers. Backups with `restic` to R2 or B2 (needs credentials from the user, so build it last). Code lives in `ml/` in this repo. Data lives outside the repo, in `/var/lib/situation-monitor/data/` (configurable).

## Record and storage rules

Every normalized record carries:

- `source`: name of the adapter.
- `published_at`: what the source says happened.
- `observed_at`: when we fetched it (UTC).
- `available_at`: when it could have been known. Rules per source below. A feature built for time T may only use records with `available_at <= T`.
- `record_hash`: content hash used to dedupe.

Layout:

```
data/
  raw/<source>/dt=YYYY-MM-DD/part-<run_id>.parquet   # normalized, append-only, never edited
  blobs/<source>/YYYY-MM-DD/<run_id>.<ext>.gz         # untouched responses, kept
  runs/ingest_runs.parquet                            # one row per run
  curated/                                            # derived tables (below)
  datasets/{train,validation,test}/                   # final splits
```

Run log columns: `run_id, source, mode (live|backfill), started_at, finished_at, requested_range, rows_fetched, rows_new, rows_rejected, bytes, status, error`. Add a `check` command that flags a source that is late, returned zero rows when it normally returns many, or has a row count far from its trailing median.

Keep all raw data. The one exception is **GDELT GKG: store aggregates only** (the raw table is multi-terabyte).

## Sources

### 1. RSS (live only, no history)

- Feed list: `src/lib/config/feeds.ts` in this repo (about 25 feeds). Read the file and port the URLs into an `ml` config. Some feeds may only work through the old Cloudflare proxy because of CORS. That limit does not apply from a server, so a feed that fails here has a real problem. Report it.
- Fields: title, link, summary, published time, feed name, category.
- Dedupe key: normalized link (lowercase host, no `www.`, drop trailing slash and tracking parameters). Fall back to source plus title. Do not use the frontend's `NewsItem.id`, which contains a feed index and changes between fetches.
- `available_at = max(published_at, observed_at)`, with published times in the future clamped to `observed_at`.
- Save the raw response in `blobs/`. Do not fetch full article text.

### 2. GDELT 2.0, live

- `lastupdate.txt` at `data.gdeltproject.org/gdeltv2/` lists the newest 15-minute files: events (`export`), `mentions` and `gkg`. History is in `masterfilelist.txt`. Files are zipped tab-separated text without a header.
- Get the column definitions from the official GDELT 2.0 codebooks, not from memory.
- Events: keep a trimmed column set (id, date added, actors with country codes, CAMEO event code and root code, Goldstein scale, number of mentions/articles, average tone, action geo country and coordinates, source URL). Do not store the whole row.
- GKG: do not keep raw rows. Aggregate on ingest to the curated table below.
- `available_at`: the file's own timestamp plus about 15 minutes, never the event date.

### 3. GDELT 2.0, backfill through BigQuery

- Tables are in the public `gdelt-bq` project, dataset `gdeltv2`. Partitioned versions exist (the names end in `_partitioned`). Confirm the exact table and partition column names with `bq show` before writing queries.
- The user has a BigQuery sandbox (no billing account): 1 TB of query processing per month, 10 GB storage, and tables the user creates expire after 60 days. Use the public tables as they are and download results to Parquet. Do not rely on storing anything in BigQuery.
- **Guardrails:**
  - Every query goes through a dry run first, and the estimated bytes are logged.
  - Refuse any single query estimated above 100 GB without asking the user.
  - Keep a running total of bytes billed per calendar month in the run log, and stop at 800 GB.
  - Select only the columns needed. BigQuery bills by columns scanned.
  - Always filter by date, and work in monthly slices so a failure loses at most one slice.
- Published sizes are from older GDELT posts and have since grown: Events about 63 GB, EventMentions about 104 GB, GKG about 3.6 TB. GKG is the one that can exhaust the quota, so aggregate it by slice and expect it to take several months of quota. Events should be feasible in one pass with trimmed columns.
- Range: 2015-02-19 (GDELT 2.0 start) to now.
- Authentication: the user runs `gcloud auth application-default login --no-launch-browser` on the VPS, or provides a service account key. Ask. Do not guess credentials.

### 4. Crypto prices (backfill and live)

- Backfill: Binance public archive, `data.binance.vision`. Spot kline zips are at `.../data/spot/monthly/klines/<SYMBOL>/<interval>/<SYMBOL>-<interval>-<YYYY>-<MM>.zip` (daily files under `daily/`), each with a `.CHECKSUM` file. Verify every checksum. Spot timestamps are in **microseconds from 2025-01-01**, milliseconds before, so parse by magnitude.
- Intervals: `1h` and `1d`.
- Live: the Binance REST klines endpoint (check its current documentation), or daily archive files for finished days.
- `available_at` = bar close time.

### 5. Stocks, indices, commodities, macro (daily)

- Candidates: Stooq bulk CSV and FRED. Conflicting information on whether Stooq now needs a captcha-issued key and enforces a daily quota. Check what works from this VPS. If Stooq is unusable, tell the user and propose an alternative from the free options. Do not scrape sites in ways their terms forbid.
- FRED needs a free API key from the user. Use the `observations` endpoint. For macro data, use ALFRED's `realtime_start` and `realtime_end` so values are as they looked when released. Some market series on FRED may be license-limited. Check each.
- `available_at`: bar close for prices, release time for macro releases.

### 6. Polymarket

- Discovery: Gamma API (`gamma-api.polymarket.com`). Price history: CLOB `prices-history` (`clob.polymarket.com`). No key needed for market data. Official docs: `docs.polymarket.com`. Respect the published rate limits.
- Live: hourly snapshot of active markets' prices. Backfill: price history for markets that have it. Some new or settled markets return empty history, which is expected.

### 7. Conflict labels

- Primary: GDELT CAMEO root codes 18 (assault), 19 (fight) and 20 (unconventional mass violence), by country and day. This works for the full history.
- ACLED is optional. The user must register first and the access terms must be checked. **Skip ACLED until the user provides a key and confirms the terms.**

## Asset list (default, pending user confirmation)

Ask the user to confirm or edit before the market backfill. Default set:

- Indices: S&P 500, Nasdaq, Dow, VIX.
- Commodities and rates: WTI crude, Brent, gold, natural gas, US 10-year yield, dollar index.
- Crypto: BTC, ETH, SOL.
- Sector ETFs: energy, technology, financials, defense.

Keep the list in one config file so adding an instrument needs no code change.

## Curated tables

Built from raw with DuckDB, stored in `curated/`:

| Table | Grain | Columns |
| --- | --- | --- |
| `gdelt_events_daily` | date × country × CAMEO root | events, mentions, avg Goldstein, avg tone |
| `gkg_daily` | date × country × theme | articles, avg tone |
| `prices_hourly`, `prices_daily` | instrument × time | open, high, low, close, volume, `available_at` |
| `polymarket_snapshots` | market × observed time | price, volume |
| `labels_price` | instrument × date | forward 1d and 5d return, direction, volatility bucket |
| `labels_conflict` | country × date | conflict event count in the next 7 days, and a surge flag |

Surge flag, default definition (tunable, record the parameters): the next-7-day count of CAMEO 18-20 events exceeds the trailing 90-day mean by two standard deviations.

## Dataset splits

By date, never random:

| Split | Period | Note |
| --- | --- | --- |
| Train | 2015-02-19 to 2022-12-31 | |
| Validation | 2023 | tuning only |
| Test | 2024-01-01 to now | do not read it while developing; write it, then leave it |
| Live forward | from the day live ingestion starts | adds RSS and later LLM scores |

For labels with a forward window, drop rows within the horizon of each split boundary so labels do not cross splits (a 7-day label near the cutoff, for example).

## Order of work

Stop after each milestone and report what actually ran, with row counts.

1. **Scaffold** (`ml/`, config, schemas, run log, `check` command, tests) and **RSS live ingestion** with a systemd timer. Start collecting immediately. Verify two consecutive hourly runs added only new rows.
2. **GDELT live** files (events, with GKG aggregation).
3. **Binance backfill** and hourly live.
4. **FRED and daily prices** (after the user supplies a FRED key and confirms the asset list).
5. **Polymarket** live and backfill.
6. **GDELT BigQuery backfill**, events first, then GKG slices, within the quota guardrails.
7. **Curated tables, labels and the split builder.** Write a short `ml/README.md` with row counts per source and split, date coverage, and known gaps.
8. **Nightly backup.**

## What the user must provide

- Google authentication for BigQuery (see above).
- A FRED API key.
- ACLED registration, if wanted, and a check of its terms.
- Confirmation of the asset list.
- Object-storage credentials for backups.
- Confirmation that the VPS disk is large enough. Report `df -h` and the projected size after the first week of GDELT events.

## Definition of done for the first dataset

- Every source above has a documented outcome: ingested, skipped with reason, or blocked with reason.
- Row counts per source and day show no unexplained gaps in the live data.
- All Binance checksums verified.
- The splits are written, with boundaries matching the table.
- No feature or label depends on a record whose `available_at` is later than the row's time. Include a test for this.
- Report any place where this brief was wrong.
