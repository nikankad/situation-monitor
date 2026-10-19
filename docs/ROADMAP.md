# OSINT Tool Roadmap

## 1. Fix Broken / Empty Panels

- [ ] Commit `misc.ts` changes — switch Polymarket to `fetchWithProxy` (fixes GitHub Pages)
- [ ] Delete dead server route `src/routes/api/polymarket/+server.ts`
- [ ] Add `VITE_FINNHUB_API_KEY` as a GitHub Actions secret
- [ ] Implement `fetchGovContracts()` using USASpending.gov API (stub already exists)
- [ ] Implement `fetchWhaleTransactions()` using Whale Alert API (stub already exists)

## 2. Free API Integrations (No Backend Required)

- [ ] **ACLED** — Armed conflict event data with casualties, actors, coordinates (better than GDELT for conflict tracking)
- [ ] **USASpending.gov** — Government contracts and spending data
- [ ] **CISA KEV** — Known Exploited Vulnerabilities RSS feed for real cyber alerts
- [ ] **ReliefWeb** — UN humanitarian crises, displacement, and emergency data
- [ ] **OpenSanctions** — Searchable sanctions and entity database
- [ ] **OpenSky Network** — Aircraft tracking (useful for monitoring military movements near hotspots)
- [ ] **MarineTraffic / VesselFinder** — Ship tracking through strategic chokepoints

## 3. Analysis Improvements

- [ ] Historical timeline — persist articles beyond 5-minute cache to track how stories evolve
- [ ] Full-text search across all cached articles
- [ ] Entity extraction — automatically pull people, orgs, and locations from headlines
- [ ] News → market correlation — flag when a news spike precedes a market move
- [ ] Source reliability scoring — rank sources by track record, not just fringe/mainstream label
- [ ] Escalation risk scoring — combine GDELT event frequency + ACLED casualties + sentiment

## 4. UX / Usability

- [ ] Export panel data to CSV / JSON
- [ ] Shareable snapshot links (encode current state in URL)
- [ ] Customizable alert thresholds (e.g. alert when topic exceeds N mentions)
- [ ] Keyboard shortcuts for panel navigation
- [ ] Mobile-responsive layout

## 5. Needs a Backend (Future)

- [ ] Push / email alerts when threshold events occur
- [ ] Persistent historical database
- [ ] Twitter / Telegram feed monitoring
- [ ] Entity relationship graph (who connects to whom across stories)
- [ ] Satellite imagery integration (Maxar, Planet Labs)
- [ ] Multi-user accounts with saved preferences
