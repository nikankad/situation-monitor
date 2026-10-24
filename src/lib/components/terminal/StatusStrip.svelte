<script lang="ts">
	import { ENTITIES, entityKey } from '$lib/config/entities';
	import { markets } from '$lib/stores';
	import { findQuote } from '$lib/analysis/quotes';
	import { formatPercentChange } from '$lib/utils';
	import type { EntityIndex } from '$lib/analysis/entity-index';
	import EntityLink from './EntityLink.svelte';
	import { changeClass } from './format';

	interface Props {
		index: EntityIndex;
	}

	let { index }: Props = $props();

	const ROWS = 3;
	const MIN_RECENT_FOR_MOMENTUM = 3;
	const MIN_MOMENTUM = 1.5;

	const stats = $derived([...index.values()]);

	const alerts = $derived(
		stats
			.filter((s) => s.alertCount > 0 && s.entity.type !== 'asset')
			.sort((a, b) => b.alertCount - a.alertCount)
			.slice(0, ROWS)
	);

	const accelerating = $derived(
		stats
			.filter((s) => s.last6h >= MIN_RECENT_FOR_MOMENTUM && s.momentum >= MIN_MOMENTUM)
			.sort((a, b) => b.momentum - a.momentum)
			.slice(0, ROWS)
	);

	const movers = $derived(
		ENTITIES.filter((e) => e.type === 'asset' && e.symbol)
			.map((entity) => ({ entity, quote: findQuote($markets, entity.symbol!) }))
			.filter((m): m is { entity: (typeof ENTITIES)[number]; quote: NonNullable<typeof m.quote> } =>
				Boolean(m.quote)
			)
			.sort((a, b) => Math.abs(b.quote.changePercent) - Math.abs(a.quote.changePercent))
			.slice(0, ROWS)
	);

	const narratives = $derived(
		stats
			.filter((s) => s.entity.type === 'narrative')
			.sort((a, b) => b.count - a.count)
			.slice(0, ROWS)
	);
</script>

<section class="t-strip" aria-label="Right now">
	<div>
		<div class="t-label">Alerts in the feeds</div>
		{#each alerts as s (entityKey(s.entity))}
			<div class="t-row">
				<span><EntityLink entity={s.entity} showType /></span>
				<span class="t-num t-down">{s.alertCount}</span>
			</div>
		{:else}
			<div class="t-row t-muted">No alert headlines</div>
		{/each}
	</div>
	<div>
		<div class="t-label">Accelerating · last 6 hours</div>
		{#each accelerating as s (entityKey(s.entity))}
			<div class="t-row">
				<span><EntityLink entity={s.entity} showType /></span>
				<span class="t-num t-up">{s.momentum.toFixed(1)}×</span>
			</div>
		{:else}
			<div class="t-row t-muted">Nothing is speeding up</div>
		{/each}
	</div>
	<div>
		<div class="t-label">Biggest market moves</div>
		{#each movers as m (m.quote.symbol)}
			<div class="t-row">
				<span><EntityLink entity={m.entity} /></span>
				<span class="t-num {changeClass(m.quote.changePercent)}">
					{formatPercentChange(m.quote.changePercent, 1)}
				</span>
			</div>
		{:else}
			<div class="t-row t-muted">No prices loaded</div>
		{/each}
	</div>
	<div>
		<div class="t-label">Narratives in circulation</div>
		{#each narratives as s (entityKey(s.entity))}
			<div class="t-row">
				<span><EntityLink entity={s.entity} /></span>
				<span class="t-num t-muted">{s.count} · {s.fringeShare}% fringe</span>
			</div>
		{:else}
			<div class="t-row t-muted">None detected</div>
		{/each}
	</div>
</section>
