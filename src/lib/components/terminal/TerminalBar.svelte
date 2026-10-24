<script lang="ts">
	import { base } from '$app/paths';
	import { isRefreshing, lastRefresh } from '$lib/stores';
	import { paletteOpen } from '$lib/stores/palette';

	interface Props {
		current?: 'overview' | 'entity' | 'panels';
	}

	let { current = 'overview' }: Props = $props();

	const updated = $derived(
		$lastRefresh
			? new Date($lastRefresh).toLocaleTimeString([], {
					hour: '2-digit',
					minute: '2-digit',
					hour12: false
				})
			: null
	);
</script>

<header class="t-bar">
	<a class="t-brand" href="{base}/">SITUATION MONITOR</a>
	<button
		class="t-search"
		type="button"
		aria-label="Search regions, topics, assets and people"
		onclick={() => paletteOpen.set(true)}
	>
		<span>Search regions, topics, assets, people</span><span class="t-kbd">/</span>
	</button>
	<nav class="t-nav" aria-label="Main">
		<a href="{base}/" aria-current={current === 'overview' ? 'page' : undefined}>OVERVIEW</a>
		<a href="{base}/dashboard" aria-current={current === 'panels' ? 'page' : undefined}>PANELS</a>
		<span>
			{#if $isRefreshing}UPDATING…{:else if updated}UPDATED {updated}{:else}NOT UPDATED{/if}
		</span>
	</nav>
</header>
