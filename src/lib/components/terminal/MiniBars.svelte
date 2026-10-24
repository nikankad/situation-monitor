<script lang="ts">
	interface Props {
		values: number[];
	}

	let { values }: Props = $props();

	const max = $derived(Math.max(1, ...values));
</script>

<span class="t-mini" role="img" aria-label="Headlines per hour, last {values.length} hours">
	{#each values as value, i (i)}
		<i
			class:empty={value === 0}
			style="height: {value === 0 ? 1 : Math.max(3, (value / max) * 18)}px"
		></i>
	{/each}
</span>
