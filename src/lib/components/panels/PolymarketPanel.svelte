<script lang="ts">
	import { Panel } from '$lib/components/common';

	interface Prediction {
		id: string;
		question: string;
		yes: number;
		volume: number | string;
		url?: string;
	}

	interface Props {
		predictions?: Prediction[];
		error?: string | null;
	}

	let { predictions = [], error = null }: Props = $props();

	function formatVolume(v: number | string): string {
		if (typeof v === 'string') return '$' + v;
		if (!v) return '$0';
		if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
		if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
		return '$' + v.toFixed(0);
	}
</script>

<Panel id="polymarket" title="Polymarket" {error}>
	{#if predictions.length === 0 && !error}
		<div class="empty-state">No markets available</div>
	{:else}
		<div class="predictions-list">
			{#each predictions as pred (pred.id)}
				<div class="prediction-item">
					<div class="market-info">
						{#if pred.url}
							<a href={pred.url} target="_blank" rel="noopener noreferrer" class="market-link">{pred.question}</a>
						{:else}
							<div class="market-text">{pred.question}</div>
						{/if}
						<div class="market-volume">{formatVolume(pred.volume)}</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</Panel>

<style>
	.predictions-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.prediction-item {
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
	}

	.prediction-item:last-child {
		border-bottom: none;
	}

	.market-info {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.market-link {
		font-size: 0.7rem;
		color: var(--accent, #4a90e2);
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s ease;
		display: block;
		line-height: 1.4;
	}

	.market-link:hover {
		text-decoration: underline;
		opacity: 0.8;
	}

	.market-text {
		font-size: 0.7rem;
		color: var(--text-primary);
		line-height: 1.4;
	}

	.market-volume {
		font-size: 0.65rem;
		color: var(--text-muted);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
