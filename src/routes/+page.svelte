<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { Header, Dashboard } from '$lib/components/layout';
	import { SettingsModal, MonitorFormModal } from '$lib/components/modals';
	import {
		NewsPanel,
		MarketsPanel,
		HeatmapPanel,
		CommoditiesPanel,
		CorrelationPanel,
		NarrativePanel,
		MapPanel,
		WhalePanel,
		PolymarketPanel,
		ContractsPanel,
		LayoffsPanel,
		SituationPanel,
		PrinterPanel,
		FedPanel,
		TwitterPanel
	} from '$lib/components/panels';
	import {
		news,
		markets,
		monitors,
		settings,
		refresh,
		allNewsItems,
		fedIndicators,
		fedNews,
		customMarkets,
		marketSettings
	} from '$lib/stores';
	import {
		fetchAllNews,
		fetchAllMarkets,
		fetchCustomMarkets,
		fetchPolymarket,
		fetchWhaleTransactions,
		fetchGovContracts,
		fetchLayoffs,
		fetchWorldLeaders,
		fetchFedIndicators,
		fetchFedNews
	} from '$lib/api';
	import type { Prediction, WhaleTransaction, Contract, Layoff } from '$lib/api';
	import type { CustomMonitor, WorldLeader } from '$lib/types';
	import type { PanelId } from '$lib/config';

	// Modal state
	let settingsOpen = $state(false);
	let monitorFormOpen = $state(false);
	let editingMonitor = $state<CustomMonitor | null>(null);

	// Initial loading state
	let initialLoading = $state(true);

	// Misc panel data
	let predictions = $state<Prediction[]>([]);
	let whales = $state<WhaleTransaction[]>([]);
	let contracts = $state<Contract[]>([]);
	let layoffs = $state<Layoff[]>([]);
	let leaders = $state<WorldLeader[]>([]);
	let tweets = $state<import('$lib/types').NewsItem[]>([]);
	let leadersLoading = $state(false);

	// Data fetching
	async function loadNews() {
		// Set loading for all categories
		const categories = ['politics', 'tech', 'finance', 'gov', 'ai', 'intel'] as const;
		categories.forEach((cat) => news.setLoading(cat, true));

		try {
			const data = await fetchAllNews();
			Object.entries(data).forEach(([category, items]) => {
				news.setItems(category as keyof typeof data, items);
			});
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
			await loadCustomMarkets();
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

			if (customSymbols.length > 0) {
				const customData = await fetchCustomMarkets(customSymbols);
				markets.setCustom(customData);
			} else {
				markets.setCustom([]);
			}
		} catch (error) {
			console.error('Failed to load custom markets:', error);
		}
	}

	async function loadMiscData() {
		try {
			const [predictionsData, whalesData, contractsData, layoffsData] = await Promise.all([
				fetchPolymarket(),
				fetchWhaleTransactions(),
				fetchGovContracts(),
				fetchLayoffs()
			]);
			predictions = predictionsData;
			whales = whalesData;
			contracts = contractsData;
			layoffs = layoffsData;
		} catch (error) {
			console.error('Failed to load misc data:', error);
		}
	}

	async function loadWorldLeaders() {
		if (!isPanelVisible('leaders')) return;
		leadersLoading = true;
		try {
			leaders = await fetchWorldLeaders();
		} catch (error) {
			console.error('Failed to load world leaders:', error);
		} finally {
			leadersLoading = false;
		}
	}

	async function loadFedData() {
		if (!isPanelVisible('fed')) return;
		fedIndicators.setLoading(true);
		fedNews.setLoading(true);
		try {
			const [indicatorsData, newsData] = await Promise.all([fetchFedIndicators(), fetchFedNews()]);
			fedIndicators.setData(indicatorsData);
			fedNews.setItems(newsData);
		} catch (error) {
			console.error('Failed to load Fed data:', error);
			fedIndicators.setError(String(error));
			fedNews.setError(String(error));
		}
	}

	async function loadTweets() {
		if (!isPanelVisible('twitter')) return;
		try {
			// For now, use demo tweets until we have a working real API
			tweets = generateDemoTweets();
		} catch (error) {
			console.error('Failed to load tweets:', error);
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

	// Monitor handlers
	function handleCreateMonitor() {
		editingMonitor = null;
		monitorFormOpen = true;
	}

	function handleEditMonitor(monitor: CustomMonitor) {
		editingMonitor = monitor;
		monitorFormOpen = true;
	}

	function handleDeleteMonitor(id: string) {
		monitors.deleteMonitor(id);
	}

	function handleToggleMonitor(id: string) {
		monitors.toggleMonitor(id);
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

	// Get ordered panel IDs (excluding map which is always first)
	const orderedPanels = $derived($settings.order.filter(id => id !== 'map' && isPanelVisible(id)));


	// Initial load
	onMount(() => {
		// Load initial data and track as refresh
		async function initialLoad() {
			refresh.startRefresh();
			try {
				await Promise.all([
					loadNews(),
					loadMarkets(),
					loadMiscData(),
					loadWorldLeaders(),
					loadFedData(),
					loadTweets()
				]);
				refresh.endRefresh();
				initialLoading = false;
			} catch (error) {
				refresh.endRefresh([String(error)]);
				// Still show the app even if there was an error
				initialLoading = false;
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
			<div class="loading-dots">
				<span class="dot"></span>
				<span class="dot"></span>
				<span class="dot"></span>
			</div>
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
						<NewsPanel category="politics" panelId="politics" title="Politics" showCountryNews={true} />
					{:else if panelId === 'tech'}
						<NewsPanel category="tech" panelId="tech" title="Tech" />
					{:else if panelId === 'finance'}
						<NewsPanel category="finance" panelId="finance" title="Finance" />
					{:else if panelId === 'gov'}
						<NewsPanel category="gov" panelId="gov" title="Government" />
					{:else if panelId === 'markets'}
						<MarketsPanel />
					{:else if panelId === 'heatmap'}
						<HeatmapPanel />
					{:else if panelId === 'commodities'}
						<CommoditiesPanel />
					{:else if panelId === 'correlation'}
						<CorrelationPanel news={$allNewsItems} />
					{:else if panelId === 'narrative'}
						<NarrativePanel news={$allNewsItems} />
					{:else if panelId === 'twitter'}
						<TwitterPanel {tweets} />
					{:else if panelId === 'fed'}
						<FedPanel />
					{:else if panelId === 'venezuela'}
						<SituationPanel
							panelId="venezuela"
							config={{
								title: 'Venezuela Watch',
								subtitle: 'Humanitarian crisis monitoring',
								criticalKeywords: ['maduro', 'caracas', 'venezuela', 'guaido']
							}}
							news={$allNewsItems.filter(
								(n) =>
									n.title.toLowerCase().includes('venezuela') ||
									n.title.toLowerCase().includes('maduro')
							)}
						/>
					{:else if panelId === 'greenland'}
						<SituationPanel
							panelId="greenland"
							config={{
								title: 'Greenland Watch',
								subtitle: 'Arctic geopolitics monitoring',
								criticalKeywords: ['greenland', 'arctic', 'nuuk', 'denmark']
							}}
							news={$allNewsItems.filter(
								(n) =>
									n.title.toLowerCase().includes('greenland') ||
									n.title.toLowerCase().includes('arctic')
							)}
						/>
					{:else if panelId === 'iran'}
						<SituationPanel
							panelId="iran"
							config={{
								title: 'Iran Crisis',
								subtitle: 'Revolution protests, regime instability & nuclear program',
								criticalKeywords: [
									'protest',
									'uprising',
									'revolution',
									'crackdown',
									'killed',
									'nuclear',
									'strike',
									'attack',
									'irgc',
									'khamenei'
								]
							}}
							news={$allNewsItems.filter(
								(n) =>
									n.title.toLowerCase().includes('iran') ||
									n.title.toLowerCase().includes('tehran') ||
									n.title.toLowerCase().includes('irgc')
							)}
						/>
					{:else if panelId === 'whales'}
						<WhalePanel {whales} />
					{:else if panelId === 'polymarket'}
						<PolymarketPanel {predictions} />
					{:else if panelId === 'contracts'}
						<ContractsPanel {contracts} />
					{:else if panelId === 'layoffs'}
						<LayoffsPanel {layoffs} />
					{:else if panelId === 'printer'}
						<PrinterPanel />
					{/if}
				</div>
			{/each}
		</Dashboard>
	</main>

	<!-- Modals -->
	<SettingsModal
		open={settingsOpen}
		onClose={() => (settingsOpen = false)}
	/>
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
		0%, 100% {
			text-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
		}
		50% {
			text-shadow: 0 0 30px rgba(0, 255, 136, 0.6);
		}
	}

	
	.loading-dots {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
	}

	.loading-dots .dot {
		width: 8px;
		height: 8px;
		background: var(--accent);
		border-radius: 50%;
		animation: pulse-dot 1.4s ease-in-out infinite;
		box-shadow: 0 0 8px var(--accent);
	}

	.loading-dots .dot:nth-child(2) {
		animation-delay: 0.2s;
	}

	.loading-dots .dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes pulse-dot {
		0%, 100% {
			opacity: 0.3;
			transform: scale(0.8);
		}
		50% {
			opacity: 1;
			transform: scale(1);
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
