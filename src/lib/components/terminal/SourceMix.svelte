<script lang="ts">
	import type { EntityStats } from '$lib/analysis/entity-index';

	interface Props {
		stats: EntityStats;
	}

	let { stats }: Props = $props();

	const total = $derived(Math.max(1, stats.count));
	const parts = $derived([
		{ key: 'mainstream', label: 'Mainstream', color: 'var(--t-accent)' },
		{ key: 'alternative', label: 'Alternative', color: 'var(--t-muted)' },
		{ key: 'fringe', label: 'Fringe', color: 'var(--t-down)' },
		{ key: 'unclassified', label: 'Other', color: 'var(--t-line-2)' }
	] as const);
</script>

<div class="t-mix" role="img" aria-label="Source mix">
	{#each parts as part (part.key)}
		<span style="width: {(stats.sourceMix[part.key] / total) * 100}%; background: {part.color}"
		></span>
	{/each}
</div>
<div class="t-legend">
	{#each parts as part (part.key)}
		{#if stats.sourceMix[part.key] > 0}
			<span>{part.label} {Math.round((stats.sourceMix[part.key] / total) * 100)}%</span>
		{/if}
	{/each}
</div>
{#if stats.sources.length > 0}
	<div style="margin-top: 8px">
		{#each stats.sources.slice(0, 5) as source (source.name)}
			<div class="t-kv">
				<span>{source.name}</span><span class="t-num t-muted">{source.count}</span>
			</div>
		{/each}
	</div>
{/if}
