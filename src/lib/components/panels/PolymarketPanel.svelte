<script lang="ts">
	import { Panel } from '$lib/components/common';
	import type { Prediction } from '$lib/api';

	interface Props {
		predictions?: Prediction[];
		loading?: boolean;
		error?: string | null;
	}

	let { predictions = [], loading = false, error = null }: Props = $props();

	function formatVolume(v: number): string {
		if (!v) return '$0';
		if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
		if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
		return '$' + v.toFixed(0);
	}

	function formatPercent(price: number): string {
		const pct = price * 100;
		if (pct > 0 && pct < 1) return '<1%';
		if (pct < 100 && pct > 99) return '>99%';
		return pct.toFixed(0) + '%';
	}

	function formatEndDate(iso?: string): string {
		if (!iso) return '';
		const date = new Date(iso);
		if (isNaN(date.getTime())) return '';
		return 'Ends ' + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
</script>

<Panel id="polymarket" title="Polymarket" count={predictions.length || null} {error}>
	{#if predictions.length === 0 && !error}
		<div class="empty-state">{loading ? 'Loading markets…' : 'No markets available'}</div>
	{:else}
		<div class="predictions-list">
			{#each predictions as pred (pred.id)}
				<a href={pred.url} target="_blank" rel="noopener noreferrer" class="prediction-item">
					<div class="market-question">{pred.question}</div>
					<div class="outcomes">
						{#each pred.outcomes as outcome, i (outcome.title + i)}
							<div class="outcome" class:leading={i === 0}>
								<div class="outcome-bar" style="width: {Math.max(outcome.price * 100, 1)}%"></div>
								<span class="outcome-title">{outcome.title}</span>
								<span class="outcome-price">{formatPercent(outcome.price)}</span>
							</div>
						{/each}
					</div>
					<div class="market-meta">
						<span>{formatVolume(pred.volume)} 24h vol</span>
						{#if formatEndDate(pred.endDate)}
							<span>{formatEndDate(pred.endDate)}</span>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</Panel>

<style>
	.predictions-list {
		display: flex;
		flex-direction: column;
	}

	.prediction-item {
		display: block;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
		text-decoration: none;
		color: inherit;
		cursor: pointer;
	}

	.prediction-item:last-child {
		border-bottom: none;
	}

	.prediction-item:hover .market-question {
		color: var(--accent);
	}

	.market-question {
		font-size: 0.7rem;
		color: var(--text-primary);
		line-height: 1.4;
		margin-bottom: 0.35rem;
	}

	.outcomes {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.outcome {
		position: relative;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		padding: 0.15rem 0.4rem;
		border-radius: 3px;
		background: rgba(255, 255, 255, 0.03);
		overflow: hidden;
		font-size: 0.6rem;
	}

	.outcome-bar {
		position: absolute;
		inset: 0 auto 0 0;
		background: rgba(var(--accent-rgb), 0.12);
	}

	.outcome.leading .outcome-bar {
		background: rgba(var(--accent-rgb), 0.25);
	}

	.outcome-title {
		position: relative;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.outcome-price {
		position: relative;
		font-weight: 600;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}

	.market-meta {
		display: flex;
		justify-content: space-between;
		margin-top: 0.3rem;
		font-size: 0.55rem;
		color: var(--text-muted);
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
