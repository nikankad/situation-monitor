<script lang="ts">
	import { Panel, NewsItem } from '$lib/components/common';
	import type { NewsCategory } from '$lib/types';
	import type { PanelId } from '$lib/config';
	import { politicsNews, techNews, financeNews, govNews, aiNews, intelNews, selectedCountry } from '$lib/stores';
	import { fetchCountryNews } from '$lib/api/countries';

	interface Props {
		category: NewsCategory;
		panelId: PanelId;
		title: string;
		showCountryNews?: boolean; // Only one panel should show country news
	}

	let { category, panelId, title, showCountryNews = false }: Props = $props();

	let countryNewsItems = $state<import('$lib/types').NewsItem[]>([]);
	let countryNewsError = $state<string | null>(null);

	// Get the appropriate derived store based on category
	const categoryStores = {
		politics: politicsNews,
		tech: techNews,
		finance: financeNews,
		gov: govNews,
		ai: aiNews,
		intel: intelNews
	};

	const categoryStore = $derived(categoryStores[category]);
	const categoryItems = $derived($categoryStore.items);
	const categoryError = $derived($categoryStore.error);

	// Load country news when country is selected (only if this panel shows country news)
	$effect(() => {
		if (!showCountryNews) return;
		const selectedCountryName = $selectedCountry.name;
		if (selectedCountryName) {
			loadCountryNews(selectedCountryName);
		} else {
			countryNewsItems = [];
			countryNewsError = null;
		}
	});

	async function loadCountryNews(countryName: string) {
		countryNewsError = null;
		try {
			countryNewsItems = await fetchCountryNews(countryName);
		} catch (error) {
			countryNewsError = 'Failed to load country news';
			console.error('Error fetching country news:', error);
		}
	}

	// Use country news if a country is selected AND this panel shows country news, otherwise use category news
	const shouldShowCountryNews = $derived(showCountryNews && $selectedCountry.name);
	const rawItems = $derived(shouldShowCountryNews ? countryNewsItems : categoryItems);
	// Sort by timestamp (most recent first)
	const items = $derived([...rawItems].sort((a, b) => b.timestamp - a.timestamp));
	const error = $derived(shouldShowCountryNews ? countryNewsError : categoryError);
	const count = $derived(items.length);
	const displayTitle = $derived(shouldShowCountryNews ? `News: ${$selectedCountry.name}` : title);

</script>

<Panel id={panelId} title={displayTitle} {error}>
	{#if items.length === 0 && !error}
		<div class="empty-state">{shouldShowCountryNews ? `No news available for ${$selectedCountry.name}` : 'No news available'}</div>
	{:else}
		<div class="news-list">
			{#each items.slice(0, 15) as item (item.id)}
				<NewsItem {item} />
			{/each}
		</div>
	{/if}
</Panel>

<style>
	.news-list {
		display: flex;
		flex-direction: column;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
