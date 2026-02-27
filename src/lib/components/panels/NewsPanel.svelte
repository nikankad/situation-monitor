<script lang="ts">
	import { Panel, NewsItem } from '$lib/components/common';
	import { KeywordSettingsModal } from '$lib/components/modals';
	import type { NewsCategory } from '$lib/types';
	import type { PanelId } from '$lib/config';
	import { politicsNews, techNews, financeNews, govNews, aiNews, intelNews } from '$lib/stores';

	interface Props {
		category: NewsCategory;
		panelId: PanelId;
		title: string;
	}

	let { category, panelId, title }: Props = $props();

	let keywordSettingsOpen = $state(false);

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


	// Sort by timestamp (most recent first)
	const items = $derived([...categoryItems].sort((a, b) => b.timestamp - a.timestamp));
	const error = $derived(categoryError);

</script>

<Panel id={panelId} title={title} {error} onSettings={() => (keywordSettingsOpen = true)}>
	{#if items.length === 0 && !error}
		<div class="empty-state">No news available</div>
	{:else}
		<div class="news-list">
			{#each items.slice(0, 15) as item (item.id)}
				<NewsItem {item} />
			{/each}
		</div>
	{/if}
</Panel>

<KeywordSettingsModal open={keywordSettingsOpen} onClose={() => (keywordSettingsOpen = false)} />

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
