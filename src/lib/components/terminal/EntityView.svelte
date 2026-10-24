<script lang="ts">
	import { base } from '$app/paths';
	import { MapPanel } from '$lib/components/panels';
	import TerminalBar from './TerminalBar.svelte';
	import EntityLink from './EntityLink.svelte';
	import Histogram from './Histogram.svelte';
	import StoryList from './StoryList.svelte';
	import SourceMix from './SourceMix.svelte';
	import { getStats } from '$lib/analysis/entity-index';
	import { clusterStories } from '$lib/analysis/stories';
	import { nearbySites, highestThreat, SITE_KIND_LABELS } from '$lib/analysis/geo';
	import { findQuote } from '$lib/analysis/quotes';
	import { getSentimentColor, type SentimentType } from '$lib/analysis/sentiment';
	import {
		ENTITY_TYPE_LABELS,
		entityKey,
		getEntity,
		type Entity,
		type EntityType
	} from '$lib/config/entities';
	import { WORLD_LEADERS } from '$lib/config/leaders';
	import { THREAT_COLORS } from '$lib/config/map';
	import { allNewsItems, markets, monitors } from '$lib/stores';
	import { entityIndex } from '$lib/stores/entities';
	import { predictions } from '$lib/stores/misc';
	import { formatPercentChange } from '$lib/utils';

	interface Props {
		entity: Entity;
	}

	let { entity }: Props = $props();

	const SITE_LIMIT = 8;
	const GROUPS: Array<{ type: EntityType; label: string }> = [
		{ type: 'region', label: 'Regions' },
		{ type: 'topic', label: 'Topics' },
		{ type: 'asset', label: 'Assets' },
		{ type: 'person', label: 'People' },
		{ type: 'narrative', label: 'Narratives' }
	];
	const SENTIMENTS: SentimentType[] = ['alarming', 'critical', 'negative', 'neutral', 'positive'];

	const stats = $derived(getStats($entityIndex, entity));
	const stories = $derived(clusterStories(stats.items));
	const sites = $derived(
		entity.location
			? nearbySites(entity.location.lat, entity.location.lon, entity.location.radiusKm)
			: []
	);
	const threat = $derived(highestThreat(sites));
	// Regions have no written summary; the nearest hotspot's description says what is at stake
	const regionSummary = $derived(sites.find((s) => s.kind === 'hotspot')?.desc ?? sites[0]?.desc);
	const quote = $derived(entity.symbol ? findQuote($markets, entity.symbol) : null);
	const leader = $derived(
		entity.leaderId ? WORLD_LEADERS.find((l) => l.id === entity.leaderId) : undefined
	);
	const linkedMarkets = $derived(
		$predictions.filter((p) => entity.matchers.some((m) => m.test(p.question))).slice(0, 5)
	);
	const together = $derived(
		GROUPS.map((group) => ({
			...group,
			items: stats.coMentions.filter((c) => c.entity.type === group.type).slice(0, 5)
		})).filter((group) => group.items.length > 0)
	);

	let showAllSites = $state(false);
	const visibleSites = $derived(showAllSites ? sites : sites.slice(0, SITE_LIMIT));

	function changeClass(value: number): string {
		if (value > 0) return 't-up';
		if (value < 0) return 't-down';
		return '';
	}

	function toneLabel(tone: number | null): string {
		if (tone === null) return 'No data';
		if (tone <= -60) return 'Alarming';
		if (tone <= -30) return 'Critical';
		if (tone < -10) return 'Negative';
		if (tone > 20) return 'Positive';
		return 'Neutral';
	}

	function rangePosition(value: number, low: number, high: number): string {
		return `${(((value - low) / (high - low)) * 100).toFixed(1)}%`;
	}

	function formatPrice(price: number): string {
		return price.toLocaleString('en-US', {
			minimumFractionDigits: price < 100 ? 2 : 0,
			maximumFractionDigits: price < 100 ? 2 : 1
		});
	}

	function quoteChange(other: Entity): number | null {
		return other.symbol ? (findQuote($markets, other.symbol)?.changePercent ?? null) : null;
	}

	function truncate(text: string | undefined, length: number): string {
		if (!text) return '';
		return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
	}

	function marketOdds(market: (typeof linkedMarkets)[number]): string {
		const top = market.outcomes[0];
		if (!top) return '';
		const percent = `${Math.round(top.price * 100)}%`;
		return top.title === 'Yes' ? percent : `${top.title} ${percent}`;
	}
</script>

<div class="t-page">
	<div class="t-wrap">
		<TerminalBar current="entity" />

		<nav class="t-crumbs" aria-label="Breadcrumb">
			<a href="{base}/">OVERVIEW</a><span>/</span>
			<span>{ENTITY_TYPE_LABELS[entity.type].toUpperCase()}S</span><span>/</span>
			<span style="color: var(--t-ink)">{entity.name.toUpperCase()}</span>
		</nav>

		<div class="t-head">
			<h1>{entity.name}</h1>
			<span class="t-tag" class:asset={entity.type === 'asset'}>
				{ENTITY_TYPE_LABELS[entity.type]}
			</span>
			{#if entity.category && entity.type !== 'person'}
				<span class="t-muted">{entity.category}</span>
			{/if}
			{#if threat}
				<span
					class="t-tag"
					style="color: {THREAT_COLORS[threat]}; border-color: {THREAT_COLORS[threat]}"
				>
					{threat} threat nearby
				</span>
			{/if}
			{#if quote}
				<span class="t-price">{formatPrice(quote.price)}</span>
				<span class="t-price {changeClass(quote.changePercent)}">
					{formatPercentChange(quote.changePercent, 1)}
				</span>
			{/if}
		</div>

		<section class="t-stats" aria-label="Key figures">
			<div>
				<div class="t-label">Headlines</div>
				<div class="t-stat-value">{stats.count}</div>
			</div>
			<div>
				<div class="t-label">Last 6 hours</div>
				<div class="t-stat-value">{stats.last6h}</div>
			</div>
			<div>
				<div class="t-label">Momentum</div>
				<div class="t-stat-value" class:t-up={stats.momentum >= 2}>
					{stats.momentum > 0 ? `${stats.momentum.toFixed(1)}×` : '—'}
				</div>
			</div>
			<div>
				<div class="t-label">Sources</div>
				<div class="t-stat-value">{stats.sourceCount}</div>
			</div>
			<div>
				<div class="t-label">Alerts</div>
				<div class="t-stat-value" class:t-down={stats.alertCount > 0}>{stats.alertCount}</div>
			</div>
			<div>
				<div class="t-label">Fringe share</div>
				<div class="t-stat-value">{stats.count > 0 ? `${stats.fringeShare}%` : '—'}</div>
			</div>
			<div>
				<div class="t-label">Tone</div>
				<div
					class="t-stat-value"
					class:t-down={stats.tone !== null && stats.tone < -10}
					class:t-up={stats.tone !== null && stats.tone > 20}
				>
					{stats.tone === null ? '—' : String(stats.tone).replace('-', '−')}
				</div>
			</div>
		</section>

		<div class="t-cols">
			<div>
				<section class="t-sec">
					<div class="t-sec-head">
						<span class="t-label">Context</span>
					</div>
					{#if entity.type === 'person' && leader}
						{#if leader.bio?.background}
							<p class="t-prose">{leader.bio.background}</p>
						{/if}
						<div class="t-kv"><span>Country</span><span>{leader.country || '—'}</span></div>
						{#if leader.since}
							<div class="t-kv"><span>In office since</span><span>{leader.since}</span></div>
						{/if}
						{#if leader.party}
							<div class="t-kv"><span>Party</span><span>{leader.party}</span></div>
						{/if}
						{#if leader.termEnds}
							<div class="t-kv"><span>Term ends</span><span>{leader.termEnds}</span></div>
						{/if}
						{#if leader.publicConsensus?.approval}
							{@const approval = leader.publicConsensus.approval}
							<div class="t-kv">
								<span>Approval ({approval.source}, {approval.lastUpdated})</span>
								<span class="t-num">
									{approval.approval}% approve · {approval.disapproval}% disapprove · {approval.trend}
								</span>
							</div>
						{/if}
						{#if leader.publicConsensus?.summary}
							<p class="t-prose muted" style="margin-top: 8px">{leader.publicConsensus.summary}</p>
						{/if}
						{#if leader.focus && leader.focus.length > 0}
							<div class="t-chips" style="margin-top: 8px">
								<span class="t-label" style="align-self: center">Focus</span>
								{#each leader.focus as focus (focus)}
									{@const topic = getEntity('topic', focus)}
									{#if topic}
										<EntityLink entity={topic} />
									{:else}
										<span class="t-chip">{focus}</span>
									{/if}
								{/each}
							</div>
						{/if}
					{:else if entity.summary}
						<p class="t-prose">{entity.summary}</p>
					{:else if regionSummary}
						<p class="t-prose">{regionSummary}</p>
					{:else if entity.type === 'region'}
						<p class="t-prose muted">No hotspot or strategic site is tracked near here yet.</p>
					{/if}

					{#if entity.type === 'narrative'}
						<p class="t-note">
							This is a tracked narrative. A headline appearing here means the wording is in
							circulation, not that the claim is accurate.
						</p>
					{/if}

					{#if entity.type === 'asset' && quote}
						{#if quote.high !== undefined && quote.low !== undefined && quote.high > quote.low}
							<div class="t-label" style="margin-top: 10px">Today's range</div>
							<div class="t-range" role="img" aria-label="Day range">
								<div class="t-range-rail"></div>
								{#if quote.open !== undefined}
									<div
										class="t-range-body"
										style="left: {rangePosition(
											Math.min(quote.open, quote.price),
											quote.low,
											quote.high
										)}; width: {(Math.abs(quote.price - quote.open) / (quote.high - quote.low)) *
											100}%"
									></div>
								{/if}
								{#if quote.previousClose !== undefined}
									<div
										class="t-range-tick"
										style="left: {rangePosition(
											Math.min(quote.high, Math.max(quote.low, quote.previousClose)),
											quote.low,
											quote.high
										)}"
										title="Previous close"
									></div>
								{/if}
							</div>
							<div class="t-legend">
								<span>Low {formatPrice(quote.low)}</span>
								{#if quote.open !== undefined}<span>Bar: open to last</span>{/if}
								{#if quote.previousClose !== undefined}<span>Tick: previous close</span>{/if}
								<span>High {formatPrice(quote.high)}</span>
							</div>
						{/if}
					{:else if entity.type === 'asset'}
						<p class="t-prose muted">
							No quote has loaded for {entity.symbol}. Stock and commodity prices need a Finnhub
							key.
						</p>
					{/if}
				</section>

				{#if entity.location}
					<section class="t-sec">
						<div class="t-sec-head">
							<span class="t-label">Map</span>
							<span class="t-dim">use + / − or Ctrl+scroll to zoom</span>
						</div>
						<MapPanel
							monitors={$monitors.monitors}
							news={$allNewsItems}
							focus={entity.location}
							title={entity.name}
						/>
					</section>

					{#if sites.length > 0}
						<section class="t-sec">
							<div class="t-sec-head">
								<span class="t-label">Strategic sites within {entity.location.radiusKm} km</span>
								<span class="t-dim">distance from the region's centre</span>
							</div>
							{#each visibleSites as site (`${site.kind}-${site.name}`)}
								<div class="t-story">
									<div class="t-story-title">
										{site.name}
										<span class="t-tag">{SITE_KIND_LABELS[site.kind]}</span>
										{#if site.level}
											<span
												class="t-tag"
												style="color: {THREAT_COLORS[site.level]}; border-color: {THREAT_COLORS[
													site.level
												]}"
											>
												{site.level}
											</span>
										{/if}
									</div>
									<div class="t-story-meta">{Math.round(site.distanceKm)} km</div>
									{#if site.desc}<p class="t-prose muted" style="margin: 0">
											{truncate(site.desc, 260)}
										</p>{/if}
								</div>
							{/each}
							{#if sites.length > SITE_LIMIT}
								<button
									class="t-filter"
									type="button"
									onclick={() => (showAllSites = !showAllSites)}
								>
									{showAllSites ? 'Show fewer' : `Show all ${sites.length} sites`}
								</button>
							{/if}
						</section>
					{/if}
				{/if}

				<section class="t-sec">
					<div class="t-sec-head">
						<span class="t-label">Stories · grouped from {stats.count} headlines</span>
						<span class="t-dim">most sources first</span>
					</div>
					<StoryList {stories} />
				</section>

				<section class="t-sec">
					<div class="t-sec-head">
						<span class="t-label">Headlines by hour</span>
						<span class="t-dim">current feed window, last 24 hours</span>
					</div>
					<Histogram values={stats.hourly} />
				</section>

				<section class="t-sec">
					<div class="t-sec-head"><span class="t-label">Mentions over time</span></div>
					<div class="t-slot">
						<b>Longer history arrives with the data service.</b><br />
						The browser only sees the headlines in the feeds right now, so days or weeks of trend need
						the stored history from the collection pipeline. This stays empty until then instead of showing
						an invented curve.
					</div>
				</section>
			</div>

			<aside>
				<section class="t-sec">
					<div class="t-sec-head"><span class="t-label">Who is reporting it</span></div>
					{#if stats.count > 0}
						<SourceMix {stats} />
					{:else}
						<div class="t-slot">No headlines yet.</div>
					{/if}
				</section>

				<section class="t-sec">
					<div class="t-sec-head">
						<span class="t-label">Tone</span>
						<span class="t-dim">keyword based</span>
					</div>
					{#if stats.count > 0}
						<div class="t-mix" role="img" aria-label="Tone distribution">
							{#each SENTIMENTS as sentiment (sentiment)}
								<span
									style="width: {(stats.sentiment[sentiment] / stats.count) *
										100}%; background: {getSentimentColor(sentiment)}"
								></span>
							{/each}
						</div>
						<div class="t-legend">
							<span>Overall: {toneLabel(stats.tone)}</span>
							{#each SENTIMENTS as sentiment (sentiment)}
								{#if stats.sentiment[sentiment] > 0}
									<span>{sentiment} {stats.sentiment[sentiment]}</span>
								{/if}
							{/each}
						</div>
					{:else}
						<div class="t-slot">No headlines yet.</div>
					{/if}
				</section>

				{#if stats.alertKeywords.length > 0}
					<section class="t-sec">
						<div class="t-sec-head"><span class="t-label">Alert keywords</span></div>
						<div class="t-chips">
							{#each stats.alertKeywords as alert (alert.keyword)}
								<span class="t-chip">{alert.keyword} · {alert.count}</span>
							{/each}
						</div>
					</section>
				{/if}

				{#each together as group (group.type)}
					<section class="t-sec">
						<div class="t-sec-head">
							<span class="t-label">Appears with · {group.label.toLowerCase()}</span>
							<span class="t-dim">shared headlines</span>
						</div>
						{#each group.items as item (entityKey(item.entity))}
							{@const change = quoteChange(item.entity)}
							<div class="t-kv">
								<span
									><EntityLink
										entity={item.entity}
										showType={item.entity.type === 'topic' || item.entity.type === 'region'}
									/></span
								>
								<span class="t-num">
									{#if change !== null}
										<span class={changeClass(change)}>
											{formatPercentChange(change, 1)}
										</span>
										·
									{/if}
									{item.count}
								</span>
							</div>
						{/each}
					</section>
				{/each}

				<section class="t-sec">
					<div class="t-sec-head"><span class="t-label">Prediction markets</span></div>
					{#each linkedMarkets as market (market.id)}
						<div class="t-kv">
							<a href={market.url} target="_blank" rel="noopener noreferrer">
								{truncate(market.question, 90)}
							</a>
							<span class="t-num">{marketOdds(market)}</span>
						</div>
					{:else}
						<div class="t-slot">No open market mentions this.</div>
					{/each}
				</section>
			</aside>
		</div>

		<p class="t-note">
			Counts describe the headlines in the feeds right now. Tone is a keyword score, not a judgement
			of the facts.
		</p>
	</div>
</div>
