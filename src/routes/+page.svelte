<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
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
	import {
		news,
		markets,
		monitors,
		settings,
		refresh,
		allNewsItems,
		customMarkets
	} from '$lib/stores';
	import {
		fetchAllNews,
		fetchAllMarkets,
		fetchCustomMarkets,
		fetchPolymarket,
		fetchGovContracts
	} from '$lib/api';
	import {
		loadCachedNews,
		loadCachedMarkets,
		saveCachedNews,
		saveCachedMarkets
	} from '$lib/services/sessionCache';
	import type { Prediction, Contract } from '$lib/api';
	import type { CustomMonitor, MarketItem, NewsCategory, NewsItem } from '$lib/types';
	import type { PanelId } from '$lib/config';

	// Modal state
	let settingsOpen = $state(false);
	let monitorFormOpen = $state(false);
	let editingMonitor = $state<CustomMonitor | null>(null);

	// Initial loading state
	let initialLoading = $state(true);

	// Misc panel data
	let predictions = $state<Prediction[]>([]);
	let contracts = $state<Contract[]>([]);

	// Data fetching
	async function loadNews() {
		// Set loading for all categories
		const categories = ['politics', 'tech', 'finance', 'gov', 'ai', 'intel'] as const;
		categories.forEach((cat) => news.setLoading(cat, true));

		const applyNews = (data: Record<NewsCategory, NewsItem[]>) => {
			(Object.keys(data) as NewsCategory[]).forEach((category) => {
				news.setItems(category, data[category]);
			});
			// Save to cache for next visit
			saveCachedNews(data);
		};

		try {
			// RSS results come back first; slower, rate-limited GDELT results follow via the callback
			applyNews(await fetchAllNews(applyNews));
		} catch (error) {
			categories.forEach((cat) => news.setError(cat, String(error)));
		}
	}

	async function loadMarkets() {
		try {
			const data = await fetchAllMarkets();
			markets.setIndices(data.indices);
			markets.setSectors(data.sectors);
			markets.setCommodities(data.commodities);
			markets.setCrypto(data.crypto);

			// Also fetch custom markets if any are configured
			const customMarketsData = await loadCustomMarkets();

			// Save to cache for next visit
			saveCachedMarkets({
				indices: data.indices,
				sectors: data.sectors,
				commodities: data.commodities,
				crypto: data.crypto,
				custom: customMarketsData
			});
		} catch (error) {
			console.error('Failed to load markets:', error);
		}
	}

	async function loadCustomMarkets() {
		try {
			// Get custom market symbols from the store
			const customMarketsMap = get(customMarkets);
			const customSymbols = Array.from(customMarketsMap.entries()).map(([symbol, name]) => ({
				symbol,
				name
			}));

			let customData: MarketItem[] = [];
			if (customSymbols.length > 0) {
				customData = await fetchCustomMarkets(customSymbols);
				markets.setCustom(customData);
			} else {
				markets.setCustom([]);
			}
			return customData;
		} catch (error) {
			console.error('Failed to load custom markets:', error);
			return [];
		}
	}

	async function loadMiscData() {
		try {
			const [predictionsData, contractsData] = await Promise.all([
				fetchPolymarket(),
				fetchGovContracts()
			]);
			predictions = predictionsData;
			contracts = contractsData;
		} catch (error) {
			console.error('Failed to load misc data:', error);
		}
	}

	// Refresh handlers
	async function handleRefresh() {
		refresh.startRefresh();
		try {
			await Promise.all([loadNews(), loadMarkets()]);
			refresh.endRefresh();
		} catch (error) {
			refresh.endRefresh([String(error)]);
		}
	}

	// Get panel visibility
	function isPanelVisible(id: PanelId): boolean {
		return $settings.enabled[id] !== false;
	}

	// Watch for custom market changes and reload when they change
	let prevCustomMarketsSize = $state(0);
	$effect(() => {
		const currentSize = $customMarkets.size;
		if (prevCustomMarketsSize !== 0 && currentSize !== prevCustomMarketsSize) {
			// Custom markets have changed, reload them
			loadCustomMarkets();
		}
		prevCustomMarketsSize = currentSize;
	});

	// Get ordered panel IDs (excluding map which is always first), with deduplication to prevent duplicate renders
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

	// Initial load with multi-stage approach and session caching
	onMount(() => {
		// Load initial data with stages
		async function initialLoad() {
			refresh.startRefresh();
			const errors: string[] = [];

			try {
				// Try to load from cache first for instant display
				const cachedNews = loadCachedNews();
				const cachedMarkets = loadCachedMarkets();

				if (cachedNews) {
					Object.entries(cachedNews.data).forEach(([category, items]) => {
						news.setItems(category as NewsCategory, items);
					});
				}

				if (cachedMarkets) {
					markets.setIndices(cachedMarkets.data.indices);
					markets.setSectors(cachedMarkets.data.sectors);
					markets.setCommodities(cachedMarkets.data.commodities);
					markets.setCrypto(cachedMarkets.data.crypto);
					markets.setCustom(cachedMarkets.data.custom);
				}

				// Critical stage: news + markets (fetch fresh data)
				try {
					await Promise.all([loadNews(), loadMarkets()]);
				} catch (error) {
					errors.push(`Critical stage error: ${String(error)}`);
				}

				// Only show UI once critical data is loaded
				initialLoading = false;

				// Secondary stage: defer misc data to after UI is visible
				// Use a small delay to let rendering complete first
				setTimeout(async () => {
					try {
						await loadMiscData();
					} catch (error) {
						errors.push(`Secondary stage error: ${String(error)}`);
					}
				}, 100);

				// Wrap up refresh after critical stage
				refresh.endRefresh(errors);
			} catch (error) {
				errors.push(String(error));
				refresh.endRefresh(errors);
				// Still show the app even if there was an error (after 5 seconds max)
				setTimeout(() => {
					initialLoading = false;
				}, 5000);
			}
		}

		initialLoad();
		refresh.setupAutoRefresh(handleRefresh);

		return () => {
			refresh.stopAutoRefresh();
		};
	});
</script>

<svelte:head>
	<title>Situation Monitor</title>
	<meta name="description" content="Real-time global situation monitoring dashboard" />
</svelte:head>

{#if initialLoading}
	<div class="loading-screen">
		<div class="loading-content">
			<div class="logo-container">
				<div class="radar-circle"></div>
				<div class="radar-circle radar-circle-2"></div>
				<div class="radar-circle radar-circle-3"></div>
				<div class="radar-sweep"></div>
			</div>
			<h1 class="loading-title">SITUATION MONITOR</h1>
		</div>
	</div>
{:else}
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
							<PolymarketPanel {predictions} />
						{:else if panelId === 'contracts'}
							<ContractsPanel {contracts} />
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
{/if}

<style>
	.loading-screen {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg);
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.loading-content {
		text-align: center;
		padding: 2rem;
		animation: slideUp 0.6s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.logo-container {
		position: relative;
		width: 120px;
		height: 120px;
		margin: 0 auto 2rem;
	}

	.radar-circle {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border: 2px solid var(--accent);
		border-radius: 50%;
		opacity: 0.3;
	}

	.radar-circle {
		width: 60px;
		height: 60px;
		animation: radarPulse 2s ease-out infinite;
	}

	.radar-circle-2 {
		width: 80px;
		height: 80px;
		animation-delay: 0.3s;
	}

	.radar-circle-3 {
		width: 100px;
		height: 100px;
		animation-delay: 0.6s;
	}

	@keyframes radarPulse {
		0% {
			transform: translate(-50%, -50%) scale(0.5);
			opacity: 0.8;
		}
		100% {
			transform: translate(-50%, -50%) scale(1.5);
			opacity: 0;
		}
	}

	.radar-sweep {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: conic-gradient(from 0deg, var(--accent) 0deg 90deg, transparent 90deg 360deg);
		transform: translate(-50%, -50%);
		animation: radarSweep 2s linear infinite;
		mask: radial-gradient(circle, transparent 45%, black 45%);
		-webkit-mask: radial-gradient(circle, transparent 45%, black 45%);
	}

	@keyframes radarSweep {
		0% {
			transform: translate(-50%, -50%) rotate(0deg);
		}
		100% {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}

	.loading-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--accent);
		letter-spacing: 0.2em;
		margin-bottom: 2rem;
		text-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
		animation: titleGlow 2s ease-in-out infinite;
	}

	@keyframes titleGlow {
		0%,
		100% {
			text-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
		}
		50% {
			text-shadow: 0 0 30px rgba(0, 255, 136, 0.6);
		}
	}

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
