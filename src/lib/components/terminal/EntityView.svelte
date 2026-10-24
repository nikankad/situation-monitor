<script lang="ts">
	import { base } from '$app/paths';
	import { MapPanel } from '$lib/components/panels';
	import TerminalBar from './TerminalBar.svelte';
	import EntityLink from './EntityLink.svelte';
	import Histogram from './Histogram.svelte';
	import Section from './Section.svelte';
	import StoryList from './StoryList.svelte';
	import SourceMix from './SourceMix.svelte';
	import {
		changeClass,
		formatMomentum,
		formatTone,
		threatStyle,
		toneClass,
		toneLabel
	} from './format';
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
	import { formatPercentChange, formatPrice } from '$lib/utils';

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

	const figures = $derived([
		{ label: 'Headlines', value: String(stats.count), cls: '' },
		{ label: 'Last 6 hours', value: String(stats.last6h), cls: '' },
		{
			label: 'Momentum',
			value: formatMomentum(stats.momentum),
			cls: stats.momentum >= 2 ? 't-up' : ''
		},
		{ label: 'Sources', value: String(stats.sourceCount), cls: '' },
		{ label: 'Alerts', value: String(stats.alertCount), cls: stats.alertCount > 0 ? 't-down' : '' },
		{
			label: 'Fringe share',
			value: stats.count > 0 ? `${stats.fringeShare}%` : '—',
			cls: ''
		},
		{ label: 'Tone', value: formatTone(stats.tone), cls: toneClass(stats.tone) }
	]);

	const leaderFacts = $derived(
		leader
			? [
					['Country', leader.country || '—'],
					['In office since', leader.since],
					['Party', leader.party],
					['Term ends', leader.termEnds]
				].filter((fact): fact is [string, string] => Boolean(fact[1]))
			: []
	);

	let showAllSites = $state(false);
	const visibleSites = $derived(showAllSites ? sites : sites.slice(0, SITE_LIMIT));

	function rangePosition(value: number, low: number, high: number): string {
		return `${(((value - low) / (high - low)) * 100).toFixed(1)}%`;
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
				<span class="t-tag" style={threatStyle(THREAT_COLORS[threat])}>
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
			{#each figures as figure (figure.label)}
				<div>
					<div class="t-label">{figure.label}</div>
					<div class="t-stat-value {figure.cls}">{figure.value}</div>
				</div>
			{/each}
		</section>

		<div class="t-cols">
			<div>
				<Section title="Context">
					{#if entity.type === 'person' && leader}
						{#if leader.bio?.background}
							<p class="t-prose">{leader.bio.background}</p>
						{/if}
						{#each leaderFacts as [label, value] (label)}
							<div class="t-kv"><span>{label}</span><span>{value}</span></div>
						{/each}
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
				</Section>

				{#if entity.location}
					<Section title="Map" hint="use + / − or Ctrl+scroll to zoom">
						<MapPanel
							monitors={$monitors.monitors}
							news={$allNewsItems}
							focus={entity.location}
							title={entity.name}
						/>
					</Section>

					{#if sites.length > 0}
						<Section
							title="Strategic sites within {entity.location.radiusKm} km"
							hint="distance from the region's centre"
						>
							{#each visibleSites as site (`${site.kind}-${site.name}`)}
								<div class="t-story">
									<div class="t-story-title">
										{site.name}
										<span class="t-tag">{SITE_KIND_LABELS[site.kind]}</span>
										{#if site.level}
											<span class="t-tag" style={threatStyle(THREAT_COLORS[site.level])}>
												{site.level}
											</span>
										{/if}
									</div>
									<div class="t-story-meta">{Math.round(site.distanceKm)} km</div>
									{#if site.desc}
										<p class="t-prose muted" style="margin: 0">{truncate(site.desc, 260)}</p>
									{/if}
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
						</Section>
					{/if}
				{/if}

				<Section title="Stories · grouped from {stats.count} headlines" hint="most sources first">
					<StoryList {stories} />
				</Section>

				<Section title="Headlines by hour" hint="current feed window, last 24 hours">
					<Histogram values={stats.hourly} />
				</Section>

				<Section title="Mentions over time">
					<div class="t-slot">
						<b>Longer history arrives with the data service.</b><br />
						The browser only sees the headlines in the feeds right now, so days or weeks of trend need
						the stored history from the collection pipeline. This stays empty until then instead of showing
						an invented curve.
					</div>
				</Section>
			</div>

			<aside>
				<Section title="Who is reporting it">
					{#if stats.count > 0}
						<SourceMix {stats} />
					{:else}
						<div class="t-slot">No headlines yet.</div>
					{/if}
				</Section>

				<Section title="Tone" hint="keyword based">
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
				</Section>

				{#if stats.alertKeywords.length > 0}
					<Section title="Alert keywords">
						<div class="t-chips">
							{#each stats.alertKeywords as alert (alert.keyword)}
								<span class="t-chip">{alert.keyword} · {alert.count}</span>
							{/each}
						</div>
					</Section>
				{/if}

				{#each together as group (group.type)}
					<Section title="Appears with · {group.label.toLowerCase()}" hint="shared headlines">
						{#each group.items as item (entityKey(item.entity))}
							{@const change = quoteChange(item.entity)}
							<div class="t-kv">
								<span>
									<EntityLink
										entity={item.entity}
										showType={item.entity.type === 'topic' || item.entity.type === 'region'}
									/>
								</span>
								<span class="t-num">
									{#if change !== null}
										<span class={changeClass(change)}>{formatPercentChange(change, 1)}</span>
										·
									{/if}
									{item.count}
								</span>
							</div>
						{/each}
					</Section>
				{/each}

				<Section title="Prediction markets">
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
				</Section>
			</aside>
		</div>

		<p class="t-note">
			Counts describe the headlines in the feeds right now. Tone is a keyword score, not a judgement
			of the facts.
		</p>
	</div>
</div>
