<script lang="ts">
	import { Panel, NewsItem } from '$lib/components/common';
	import { KeywordSettingsModal } from '$lib/components/modals';
	import type { NewsCategory, NewsItem as NewsItemType } from '$lib/types';
	import type { PanelId } from '$lib/config';
	import { politicsNews, techNews, financeNews, govNews, aiNews, intelNews } from '$lib/stores';

	interface Props {
		category: NewsCategory;
		panelId: PanelId;
		title: string;
	}

	let { category, panelId, title }: Props = $props();

	const MAX_ITEMS = 30;

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
	const error = $derived($categoryStore.error);
	const loading = $derived($categoryStore.loading);

	// GDELT and RSS often return the same story; keep the first (most recent) copy of each headline
	function dedupe(list: NewsItemType[]): NewsItemType[] {
		const seen = new Set<string>();
		return list.filter((item) => {
			const key = item.title
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, ' ')
				.trim();
			if (seen.has(key) || seen.has(item.link)) return false;
			seen.add(key);
			seen.add(item.link);
			return true;
		});
	}

	// Sort by timestamp (most recent first)
	const items = $derived(
		dedupe([...$categoryStore.items].sort((a, b) => b.timestamp - a.timestamp)).slice(0, MAX_ITEMS)
	);
</script>

<Panel
	id={panelId}
	{title}
	count={items.length || null}
	{error}
	onSettings={() => (keywordSettingsOpen = true)}
>
	{#if items.length === 0 && !error}
		<div class="empty-state">{loading ? 'Loading news…' : 'No news available'}</div>
	{:else}
		<div class="news-list">
			{#each items as item (item.id)}
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
