<script lang="ts">
	interface Props {
		values: number[];
		label?: string;
		/** Small bars for table rows, without the time axis */
		compact?: boolean;
	}

	let { values, label = 'Headlines per hour', compact = false }: Props = $props();

	const max = $derived(Math.max(1, ...values));
</script>

{#if compact}
	<span class="t-mini" role="img" aria-label="{label}, last {values.length} hours">
		{#each values as value, i (i)}
			<i
				class:empty={value === 0}
				style="height: {value === 0 ? 1 : Math.max(3, (value / max) * 18)}px"
			></i>
		{/each}
	</span>
{:else}
	<div class="t-hist" role="img" aria-label="{label}: {values.join(', ')}">
		{#each values as value, i (i)}
			<span
				class:empty={value === 0}
				style="height: {value === 0 ? 3 : Math.max(8, (value / max) * 100)}%"
				title="{value} headline{value === 1 ? '' : 's'}"
			></span>
		{/each}
	</div>
	<div class="t-hist-axis"><span>{values.length}h ago</span><span>now</span></div>
{/if}
