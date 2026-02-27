<script lang="ts">
	import { Panel } from '$lib/components/common';

	interface Outcome {
		title: string;
		price: number;
	}

	interface Prediction {
		id: string;
		question: string;
		volume: number;
		url: string;
		outcomes: Outcome[];
	}

	interface Props {
		predictions?: Prediction[];
		error?: string | null;
	}

	let { predictions = [], error = null }: Props = $props();

	function formatVolume(v: number): string {
		if (!v) return '$0';
		if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
		if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
		return '$' + v.toFixed(0);
	}

	function formatOutcomeSubtitle(outcomes: Outcome[]): string {
		return outcomes
			.slice(0, 3)
			.map((outcome) => `${outcome.title} ${(outcome.price * 100).toFixed(0)}%`)
			.join(' · ');
	}
</script>

<Panel id="polymarket" title="Polymarket" {error}>
	{#if predictions.length === 0 && !error}
		<div class="empty-state">No markets available</div>
	{:else}
		<div class="predictions-list">
			{#each predictions as pred (pred.id)}
				<a href={pred.url} target="_blank" rel="noopener noreferrer" class="prediction-item">
					<div class="market-info">
						<div class="market-header">
							<div class="market-text">
								<div class="market-question">{pred.question}</div>
								{#if pred.outcomes.length > 0}
									<div class="market-subtitle">{formatOutcomeSubtitle(pred.outcomes)}</div>
								{/if}
							</div>
							<div class="market-volume">{formatVolume(pred.volume)}</div>
						</div>
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
		gap: 0.5rem;
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
		color: var(--accent, #4a90e2);
	}

	.market-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.market-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.market-text {
		flex: 1;
		min-width: 0;
	}

	.market-question {
		font-size: 0.7rem;
		color: var(--text-primary);
		line-height: 1.4;
		flex: 1;
	}

	.market-subtitle {
		font-size: 0.62rem;
		line-height: 1.35;
		color: var(--text-secondary);
		margin-top: 0.2rem;
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
