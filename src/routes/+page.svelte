<script lang="ts">
	import { onMount, type Component } from 'svelte';
	import { connections } from '$lib/stores/connections';
	import { setCacheAccount } from '$lib/services/sessionCache';
	import { initializePreferences, flushPreferences } from '$lib/services/preferences';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let Dashboard: Component | null = $state(null);
	let failed = $state(false);

	onMount(() => {
		initializePreferences(data.preferences);
		connections.set(data.connections);
		setCacheAccount(data.user.id!);
		// Import the browser-only stores after initializing this account's settings.
		import('$lib/components/DashboardPage.svelte')
			.then((module) => {
				Dashboard = module.default;
			})
			.catch(() => {
				failed = true;
			});
		const save = () => {
			void flushPreferences();
		};
		window.addEventListener('pagehide', save);
		return () => window.removeEventListener('pagehide', save);
	});
</script>

{#if Dashboard}
	<Dashboard />
{:else}
	<main class="bootstrap" aria-live="polite">
		<h1>SITUATION MONITOR</h1>
		<p>
			{failed ? 'Your dashboard could not load. Reload to try again.' : 'Opening your workspace…'}
		</p>
		{#if failed}<a href="/" data-sveltekit-reload>Reload dashboard</a>{/if}
	</main>
{/if}

<style>
	.bootstrap {
		min-height: 100vh;
		display: grid;
		place-content: center;
		text-align: center;
		gap: 1rem;
		padding: 2rem;
	}
	h1 {
		color: var(--accent);
		letter-spacing: 0.15em;
		font-size: 1.2rem;
	}
	p {
		color: var(--text-secondary);
	}
</style>
