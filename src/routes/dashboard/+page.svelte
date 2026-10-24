<script lang="ts">
	import { Header, Dashboard } from '$lib/components/layout';
	import { SettingsModal, MonitorFormModal } from '$lib/components/modals';
	import {
		NewsPanel,
		MarketsPanel,
		CorrelationPanel,
		NarrativePanel,
		MapPanel,
		PolymarketPanel,
		ContractsPanel
	} from '$lib/components/panels';
	import { monitors, settings, allNewsItems } from '$lib/stores';
	import { predictions, contracts, miscLoading } from '$lib/stores/misc';
	import type { CustomMonitor } from '$lib/types';
	import type { PanelId } from '$lib/config';

	// Modal state
	let settingsOpen = $state(false);
	let monitorFormOpen = $state(false);
	let editingMonitor = $state<CustomMonitor | null>(null);

	function isPanelVisible(id: PanelId): boolean {
		return $settings.enabled[id] !== false;
	}

	// Ordered panel IDs (the map is always first), de-duplicated to prevent duplicate renders
	const orderedPanels = $derived(
		(() => {
			const seenIds = new Set<PanelId>();
			return $settings.order.filter((id) => {
				if (id === 'map' || !isPanelVisible(id) || seenIds.has(id)) return false;
				seenIds.add(id);
				return true;
			});
		})()
	);
</script>

<svelte:head>
	<title>Situation Monitor</title>
	<meta name="description" content="Real-time global situation monitoring dashboard" />
</svelte:head>

<div class="app fade-in">
	<Header onSettingsClick={() => (settingsOpen = true)} />

	<main class="main-content">
		<Dashboard>
			<!-- Map Panel - Full width (always first) -->
			{#if isPanelVisible('map')}
				<div class="panel-slot map-slot panel-animate" style="--delay: 0">
					<MapPanel monitors={$monitors.monitors} news={$allNewsItems} />
				</div>
			{/if}

			<!-- Dynamic panels based on order -->
			{#each orderedPanels as panelId, index (panelId)}
				<div class="panel-slot panel-animate" style="--delay: {index + 1}">
					{#if panelId === 'politics'}
						<NewsPanel category="politics" panelId="politics" title="Politics" />
					{:else if panelId === 'tech'}
						<NewsPanel category="tech" panelId="tech" title="Tech" />
					{:else if panelId === 'finance'}
						<NewsPanel category="finance" panelId="finance" title="Finance" />
					{:else if panelId === 'gov'}
						<NewsPanel category="gov" panelId="gov" title="Government" />
					{:else if panelId === 'markets'}
						<MarketsPanel />
					{:else if panelId === 'correlation'}
						<CorrelationPanel news={$allNewsItems} />
					{:else if panelId === 'narrative'}
						<NarrativePanel news={$allNewsItems} />
					{:else if panelId === 'polymarket'}
						<PolymarketPanel predictions={$predictions} loading={$miscLoading} />
					{:else if panelId === 'contracts'}
						<ContractsPanel contracts={$contracts} loading={$miscLoading} />
					{/if}
				</div>
			{/each}
		</Dashboard>
	</main>

	<!-- Modals -->
	<SettingsModal open={settingsOpen} onClose={() => (settingsOpen = false)} />
	<MonitorFormModal
		open={monitorFormOpen}
		onClose={() => (monitorFormOpen = false)}
		editMonitor={editingMonitor}
	/>
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg);
	}

	.app.fade-in {
		animation: appFadeIn 0.6s ease-out;
	}

	@keyframes appFadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.main-content {
		flex: 1;
		padding: 0.5rem;
		/* Removed overflow-y: auto to allow body scroll */
	}

	.map-slot {
		margin-bottom: 0.5rem;
		height: auto !important;
	}

	.panel-slot:not(.map-slot) {
		height: 100%;
	}

	.panel-animate {
		animation: panelSlideIn 0.6s ease-out forwards;
		animation-delay: calc(var(--delay) * 0.08s);
		opacity: 0;
		transform: translateY(20px) scale(0.95);
	}

	@keyframes panelSlideIn {
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@media (max-width: 768px) {
		.main-content {
			padding: 0.25rem;
		}

		.panel-animate {
			animation-delay: calc(var(--delay) * 0.05s);
		}
	}
</style>
