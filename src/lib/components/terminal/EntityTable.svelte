<script lang="ts">
	import { ENTITIES, ENTITY_TYPE_LABELS, entityKey, type EntityType } from '$lib/config/entities';
	import { getStats, type EntityIndex, type EntityStats } from '$lib/analysis/entity-index';
	import { findQuote } from '$lib/analysis/quotes';
	import { markets } from '$lib/stores';
	import { formatPercentChange, formatPrice } from '$lib/utils';
	import EntityLink from './EntityLink.svelte';
	import Histogram from './Histogram.svelte';
	import { changeClass, formatMomentum, formatTone, toneClass } from './format';

	interface Props {
		index: EntityIndex;
	}

	let { index }: Props = $props();

	type SortKey =
		'name' | 'count' | 'last6h' | 'momentum' | 'sources' | 'alerts' | 'fringe' | 'tone' | 'change';

	interface Row {
		stats: EntityStats;
		price: number | null;
		change: number | null;
	}

	const PAGE_SIZE = 25;
	const TYPES: Array<EntityType | 'all'> = [
		'all',
		'region',
		'topic',
		'asset',
		'person',
		'narrative'
	];
	const COLUMNS: Array<{ key: SortKey; label: string; numeric: boolean }> = [
		{ key: 'count', label: 'Headlines', numeric: true },
		{ key: 'last6h', label: '6h', numeric: true },
		{ key: 'momentum', label: 'Pace', numeric: true },
		{ key: 'sources', label: 'Sources', numeric: true },
		{ key: 'alerts', label: 'Alerts', numeric: true },
		{ key: 'fringe', label: 'Fringe', numeric: true },
		{ key: 'tone', label: 'Tone', numeric: true }
	];

	let typeFilter = $state<EntityType | 'all'>('all');
	let sortKey = $state<SortKey>('count');
	let descending = $state(true);
	let visibleCount = $state(PAGE_SIZE);

	// Every entity with headlines, plus assets that have a price
	const rows = $derived.by<Row[]>(() => {
		const result: Row[] = [];
		for (const entity of ENTITIES) {
			const stats = getStats(index, entity);
			const quote = entity.symbol ? findQuote($markets, entity.symbol) : null;
			if (stats.count === 0 && !quote) continue;
			result.push({ stats, price: quote?.price ?? null, change: quote?.changePercent ?? null });
		}
		return result;
	});

	const counts = $derived.by<Record<EntityType | 'all', number>>(() => {
		const tally = { all: rows.length, region: 0, topic: 0, asset: 0, person: 0, narrative: 0 };
		for (const row of rows) tally[row.stats.entity.type]++;
		return tally;
	});

	function value(row: Row, key: SortKey): number | string | null {
		switch (key) {
			case 'name':
				return row.stats.entity.name.toLowerCase();
			case 'count':
				return row.stats.count;
			case 'last6h':
				return row.stats.last6h;
			case 'momentum':
				return row.stats.momentum;
			case 'sources':
				return row.stats.sourceCount;
			case 'alerts':
				return row.stats.alertCount;
			case 'fringe':
				return row.stats.count > 0 ? row.stats.fringeShare : null;
			case 'tone':
				return row.stats.tone;
			case 'change':
				return row.change;
		}
	}

	const sorted = $derived.by<Row[]>(() => {
		const direction = descending ? -1 : 1;
		return rows
			.filter((row) => typeFilter === 'all' || row.stats.entity.type === typeFilter)
			.sort((a, b) => {
				const x = value(a, sortKey);
				const y = value(b, sortKey);
				// Missing values always sort last
				if (x === null && y === null) return 0;
				if (x === null) return 1;
				if (y === null) return -1;
				if (typeof x === 'string' && typeof y === 'string') return x.localeCompare(y) * direction;
				return ((x as number) - (y as number)) * direction;
			});
	});

	const visible = $derived(sorted.slice(0, visibleCount));

	function sortBy(key: SortKey): void {
		if (sortKey === key) {
			descending = !descending;
		} else {
			sortKey = key;
			descending = key !== 'name';
		}
	}

	function setType(type: EntityType | 'all'): void {
		typeFilter = type;
		visibleCount = PAGE_SIZE;
	}

	function label(type: EntityType | 'all'): string {
		return type === 'all' ? 'All' : `${ENTITY_TYPE_LABELS[type]}s`;
	}

	function arrow(key: SortKey): string {
		return sortKey === key ? (descending ? ' ▼' : ' ▲') : '';
	}
</script>

<div class="t-sec-head">
	<div class="t-filters" role="group" aria-label="Filter by type">
		{#each TYPES as type (type)}
			<button
				class="t-filter"
				type="button"
				aria-pressed={typeFilter === type}
				onclick={() => setType(type)}
			>
				{label(type)}
				{counts[type]}
			</button>
		{/each}
	</div>
</div>

<div class="t-tablewrap">
	<table class="t-table">
		<thead>
			<tr>
				<th>
					<button type="button" aria-pressed={sortKey === 'name'} onclick={() => sortBy('name')}>
						Entity{arrow('name')}
					</button>
				</th>
				{#each COLUMNS as column (column.key)}
					<th class="r">
						<button
							type="button"
							aria-pressed={sortKey === column.key}
							onclick={() => sortBy(column.key)}
						>
							{column.label}{arrow(column.key)}
						</button>
					</th>
				{/each}
				<th class="r">Price</th>
				<th class="r">
					<button
						type="button"
						aria-pressed={sortKey === 'change'}
						onclick={() => sortBy('change')}
					>
						Chg{arrow('change')}
					</button>
				</th>
				<th>24h</th>
			</tr>
		</thead>
		<tbody>
			{#each visible as row (entityKey(row.stats.entity))}
				<tr>
					<td class="t-name"><EntityLink entity={row.stats.entity} showType /></td>
					<td class="r t-num">{row.stats.count}</td>
					<td class="r t-num">{row.stats.last6h}</td>
					<td class="r t-num" class:t-up={row.stats.momentum >= 2}>
						{formatMomentum(row.stats.momentum)}
					</td>
					<td class="r t-num">{row.stats.sourceCount}</td>
					<td class="r t-num" class:t-down={row.stats.alertCount > 0}>{row.stats.alertCount}</td>
					<td class="r t-num">{row.stats.count > 0 ? `${row.stats.fringeShare}%` : '—'}</td>
					<td class="r t-num {toneClass(row.stats.tone)}">{formatTone(row.stats.tone)}</td>
					<td class="r t-num">{row.price === null ? '—' : formatPrice(row.price)}</td>
					<td class="r t-num {changeClass(row.change)}">
						{row.change === null ? '—' : formatPercentChange(row.change, 1)}
					</td>
					<td><Histogram values={row.stats.hourly} compact /></td>
				</tr>
			{:else}
				<tr>
					<td colspan="11" class="t-muted">No headlines match yet. Data is still loading.</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if sorted.length > visibleCount}
	<button class="t-filter" type="button" onclick={() => (visibleCount += PAGE_SIZE)}>
		Show {Math.min(PAGE_SIZE, sorted.length - visibleCount)} more
	</button>
{/if}
