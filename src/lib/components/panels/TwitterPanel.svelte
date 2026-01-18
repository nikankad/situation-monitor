<script lang="ts">
	import { Panel } from '$lib/components/common';
	import type { NewsItem } from '$lib/types';

	interface Props {
		news?: NewsItem[];
		loading?: boolean;
		error?: string | null;
	}

	let { news = [], loading = false, error = null }: Props = $props();

	// Twitter/X account sources via Nitter
	const TWITTER_SOURCES = [
		'ISW Analysis (𝕏)',
		'Bellingcat (𝕏)',
		'War Monitor (𝕏)',
		'Reuters (𝕏)',
		'AP News (𝕏)',
		'Elon Musk (𝕏)'
	];

	// Filter tweets from the news items
	const tweets = $derived(
		news.filter((item) => TWITTER_SOURCES.includes(item.source)).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
	);

	function formatTime(timestamp?: number): string {
		if (!timestamp) return 'recently';
		const date = new Date(timestamp);
		const now = new Date();
		const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (seconds < 60) return 'now';
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
		return `${Math.floor(seconds / 86400)}d ago`;
	}

	function getSourceColor(source: string): string {
		switch (source) {
			case 'ISW Analysis (𝕏)':
				return '#FF0000';
			case 'Bellingcat (𝕏)':
				return '#1DA1F2';
			case 'War Monitor (𝕏)':
				return '#FF6B35';
			case 'Reuters (𝕏)':
				return '#FF8000';
			case 'AP News (𝕏)':
				return '#002868';
			case 'Elon Musk (𝕏)':
				return '#00A9FF';
			default:
				return '#666';
		}
	}

	function getSourceIcon(source: string): string {
		switch (source) {
			case 'ISW Analysis (𝕏)':
				return '🎯';
			case 'Bellingcat (𝕏)':
				return '🔍';
			case 'War Monitor (𝕏)':
				return '⚔️';
			case 'Reuters (𝕏)':
				return '📰';
			case 'AP News (𝕏)':
				return '📡';
			case 'Elon Musk (𝕏)':
				return '🚀';
			default:
				return '𝕏';
		}
	}
</script>

<Panel id="twitter" title="Twitter/X Feed" {loading} {error}>
	{#if tweets.length === 0 && !loading && !error}
		<div class="empty-state">No tweets available yet. Fetching from accounts...</div>
	{:else if tweets.length > 0}
		<div class="tweets-container">
			{#each tweets.slice(0, 20) as tweet}
				<div class="tweet-card">
					<div class="tweet-header">
						<div class="source-badge" style="background: {getSourceColor(tweet.source)}">
							<span class="source-icon">{getSourceIcon(tweet.source)}</span>
							<span class="source-name">{tweet.source}</span>
						</div>
						<span class="tweet-time">{formatTime(tweet.timestamp)}</span>
					</div>

					<a href={tweet.link} target="_blank" rel="noopener" class="tweet-content">
						<p class="tweet-text">{tweet.title}</p>
					</a>

					{#if tweet.isAlert}
						<div class="alert-badge">🚨 Alert</div>
					{/if}

					{#if tweet.topics && tweet.topics.length > 0}
						<div class="topics-list">
							{#each tweet.topics.slice(0, 2) as topic}
								<span class="topic-tag">{topic}</span>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty-state">Loading tweets...</div>
	{/if}
</Panel>

<style>
	.tweets-container {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.tweet-card {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.6rem;
		transition: all 0.2s ease;
	}

	.tweet-card:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: var(--accent);
	}

	.tweet-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.4rem;
	}

	.source-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		color: white;
		font-size: 0.5rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.source-icon {
		font-size: 0.6rem;
	}

	.source-name {
		max-width: 100px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tweet-time {
		font-size: 0.5rem;
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.tweet-content {
		text-decoration: none;
		cursor: pointer;
		margin-bottom: 0.3rem;
		display: block;
	}

	.tweet-text {
		font-size: 0.6rem;
		color: var(--text-primary);
		line-height: 1.4;
		margin: 0;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	.tweet-content:hover .tweet-text {
		color: var(--accent);
		text-decoration: underline;
	}

	.alert-badge {
		display: inline-block;
		font-size: 0.5rem;
		color: #ff4444;
		background: rgba(255, 68, 68, 0.15);
		border: 1px solid rgba(255, 68, 68, 0.3);
		padding: 0.15rem 0.3rem;
		border-radius: 3px;
		margin-bottom: 0.3rem;
		font-weight: 600;
	}

	.topics-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem;
		margin-top: 0.3rem;
	}

	.topic-tag {
		font-size: 0.45rem;
		background: rgba(255, 255, 255, 0.1);
		color: var(--text-muted);
		padding: 0.1rem 0.25rem;
		border-radius: 2px;
		border: 1px solid var(--border);
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
