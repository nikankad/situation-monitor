<script lang="ts">
	import Modal from './Modal.svelte';
	import type { NewsItem } from '$lib/types';
	import { timeAgo } from '$lib/utils';

	interface Props {
		open: boolean;
		region: string;
		items: NewsItem[];
		onClose: () => void;
	}

	let { open, region, items, onClose }: Props = $props();

	// Sort items by timestamp (newest first)
	const sortedItems = $derived(
		[...items].sort((a, b) => b.timestamp - a.timestamp)
	);

	// Count alerts
	const alertCount = $derived(items.filter(item => item.isAlert).length);
</script>

<Modal {open} title="{region.toUpperCase()} - {items.length} News Items" {onClose}>
	<div class="cluster-stats">
		<span class="stat">
			<span class="stat-value">{items.length}</span>
			<span class="stat-label">Total</span>
		</span>
		<span class="stat alert">
			<span class="stat-value">{alertCount}</span>
			<span class="stat-label">Alerts</span>
		</span>
	</div>

	<div class="news-list">
		{#each sortedItems as item (item.id)}
			<a
				href={item.link}
				target="_blank"
				rel="noopener noreferrer"
				class="news-item"
				class:is-alert={item.isAlert}
			>
				<div class="news-header">
					{#if item.isAlert}
						<span class="alert-badge">ALERT</span>
					{/if}
					<span class="news-source">{item.source}</span>
					<span class="news-time">{timeAgo(item.timestamp)}</span>
				</div>
				<h3 class="news-title">{item.title}</h3>
				{#if item.alertKeyword}
					<span class="alert-keyword">{item.alertKeyword}</span>
				{/if}
				{#if item.description}
					<p class="news-description">{item.description.slice(0, 150)}...</p>
				{/if}
			</a>
		{/each}
	</div>
</Modal>

<style>
	.cluster-stats {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border);
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 4px;
	}

	.stat.alert {
		background: rgba(255, 68, 68, 0.1);
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.stat.alert .stat-value {
		color: #ff4444;
	}

	.stat-label {
		font-size: 0.65rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.news-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.news-item {
		display: block;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--border);
		border-radius: 4px;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.news-item:hover {
		background: rgba(255, 255, 255, 0.06);
		border-color: var(--accent);
	}

	.news-item.is-alert {
		border-left: 3px solid #ff4444;
		background: rgba(255, 68, 68, 0.05);
	}

	.news-item.is-alert:hover {
		background: rgba(255, 68, 68, 0.1);
	}

	.news-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.alert-badge {
		font-size: 0.55rem;
		font-weight: 700;
		color: #fff;
		background: #ff4444;
		padding: 0.15rem 0.4rem;
		border-radius: 2px;
		letter-spacing: 0.05em;
	}

	.news-source {
		font-size: 0.65rem;
		color: var(--accent);
		font-weight: 500;
	}

	.news-time {
		font-size: 0.6rem;
		color: var(--text-muted);
		margin-left: auto;
	}

	.news-title {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-primary);
		margin: 0 0 0.25rem 0;
		line-height: 1.4;
	}

	.alert-keyword {
		display: inline-block;
		font-size: 0.55rem;
		color: #ff8888;
		background: rgba(255, 68, 68, 0.15);
		padding: 0.1rem 0.3rem;
		border-radius: 2px;
		margin-bottom: 0.25rem;
	}

	.news-description {
		font-size: 0.7rem;
		color: var(--text-secondary);
		margin: 0.25rem 0 0 0;
		line-height: 1.5;
	}
</style>
