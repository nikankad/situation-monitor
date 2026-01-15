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
	}

	let { category, panelId, title }: Props = $props();

	let countryNewsItems = $state<import('$lib/types').NewsItem[]>([]);
	let countryNewsLoading = $state(false);
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
	const categoryLoading = $derived($categoryStore.loading);
	const categoryError = $derived($categoryStore.error);

	// Load country news when country is selected
	$effect(() => {
		const selectedCountryName = $selectedCountry.name;
		if (selectedCountryName) {
			loadCountryNews(selectedCountryName);
		} else {
			countryNewsItems = [];
			countryNewsError = null;
		}
	});

	async function loadCountryNews(countryName: string) {
		countryNewsLoading = true;
		countryNewsError = null;
		try {
			countryNewsItems = await fetchCountryNews(countryName);
		} catch (error) {
			countryNewsError = 'Failed to load country news';
			console.error('Error fetching country news:', error);
		} finally {
			countryNewsLoading = false;
		}
	}

	// Use country news if a country is selected, otherwise use category news
	const rawItems = $derived($selectedCountry.name ? countryNewsItems : categoryItems);
	// Sort by timestamp (most recent first)
	const items = $derived([...rawItems].sort((a, b) => b.timestamp - a.timestamp));
	const loading = $derived($selectedCountry.name ? countryNewsLoading : categoryLoading);
	const error = $derived($selectedCountry.name ? countryNewsError : categoryError);
	const count = $derived(items.length);
	const displayTitle = $derived($selectedCountry.name ? `News: ${$selectedCountry.name}` : title);

</script>

<Panel id={panelId} title={displayTitle} {count} {loading} {error}>
	{#if items.length === 0 && !loading && !error}
		<div class="empty-state">{$selectedCountry.name ? `No news available for ${$selectedCountry.name}` : 'No news available'}</div>
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
