<script lang="ts">
	import { onMount } from 'svelte';
	import EconomicPanel from './panels/EconomicPanel.svelte';
	import { get } from 'svelte/store';
	import { Header, Dashboard } from '$lib/components/layout';
	import { SettingsModal } from '$lib/components/modals';
	import {
		NewsPanel,
		IntelPanel,
		MarketsPanel,
		CorrelationPanel,
		NarrativePanel,
		MapPanel,
		WhalePanel,
		PolymarketPanel,
		ContractsPanel,
		SituationPanel
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
		fetchWhaleTransactions,
		fetchGovContracts
	} from '$lib/api';
	import {
		loadCachedNews,
		loadCachedMarkets,
		saveCachedNews,
		saveCachedMarkets,
		clearSessionCache
	} from '$lib/services/sessionCache';
	import type { Prediction, WhaleTransaction, Contract } from '$lib/api';
	import type { MarketItem } from '$lib/types';
	import type { PanelId } from '$lib/config';

	// Modal state
	let settingsOpen = $state(false);
	let refreshVersion = $state(0);

	// Misc panel data
	let predictions = $state<Prediction[]>([]);
	let whales = $state<WhaleTransaction[]>([]);
	let contracts = $state<Contract[]>([]);

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
			// Save to cache for next visit
			saveCachedNews(data);
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
			const [predictionsData, whalesData, contractsData] = await Promise.all([
				fetchPolymarket(),
				fetchWhaleTransactions(),
				fetchGovContracts()
			]);
			console.log('[+page] Polymarket predictions loaded:', predictionsData.length);
			if (predictionsData.length > 0) {
				console.log('[+page] First prediction:', predictionsData[0]);
			}
			predictions = predictionsData;
			whales = whalesData;
			contracts = contractsData;
		} catch (error) {
			console.error('Failed to load misc data:', error);
		}
	}

	// Refresh handlers
	async function handleRefresh() {
		refreshVersion += 1;
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
						news.setItems(category as any, items);
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

<div class="app fade-in">
	<Header onSettingsClick={() => (settingsOpen = true)} />

	<main class="main-content">
		{#if $monitors.monitors.some((monitor) => monitor.enabled)}
			<section class="topic-monitors" aria-label="Your topic monitors">
				{#each $monitors.monitors.filter((monitor) => monitor.enabled) as monitor (monitor.id)}
					{@const matches = $allNewsItems.filter((item) =>
						monitor.keywords.some((keyword) =>
							`${item.title} ${item.description ?? ''}`
								.toLowerCase()
								.includes(keyword.toLowerCase())
						)
					)}
					<article>
						<h2>{monitor.name} <span>{matches.length} matches</span></h2>
						{#each matches.slice(0, 3) as item (item.id)}
							<a href={item.link} target="_blank" rel="noopener noreferrer">{item.title}</a>
						{:else}<p>No matching articles yet.</p>{/each}
					</article>
				{/each}
			</section>
		{/if}
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
					{:else if panelId === 'economics'}
						<EconomicPanel {refreshVersion} />
					{:else if panelId === 'intel'}
						<IntelPanel />
					{:else if panelId === 'whales'}
						<WhalePanel {whales} />
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
	<SettingsModal
		open={settingsOpen}
		onClose={() => (settingsOpen = false)}
		onKeysChanged={() => {
			clearSessionCache();
			refreshVersion += 1;
			void loadMarkets();
		}}
		onRefreshSettingsChanged={() => refresh.setupAutoRefresh(handleRefresh)}
	/>
</div>

<style>
	.topic-monitors {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.topic-monitors article {
		padding: 0.8rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 4px;
	}
	.topic-monitors h2 {
		margin: 0 0 0.5rem;
		font-size: 0.75rem;
	}
	.topic-monitors h2 span {
		color: var(--text-muted);
		font-size: 0.6rem;
		margin-left: 0.5rem;
	}
	.topic-monitors a {
		display: block;
		margin-top: 0.5rem;
		font-size: 0.7rem;
	}
	.topic-monitors p {
		color: var(--text-secondary);
		font-size: 0.65rem;
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
