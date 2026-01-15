<script lang="ts">
	import { Panel, Badge } from '$lib/components/common';
	import { analyzeSentiment, getSentimentColor, getSentimentEmoji, type SentimentType } from '$lib/analysis/sentiment';
	import type { NewsItem } from '$lib/types';

	interface Props {
		news?: NewsItem[];
		loading?: boolean;
		error?: string | null;
	}

	let { news = [], loading = false, error = null }: Props = $props();

	const sentimentAnalysis = $derived(analyzeSentiment(news, 30));

	function getSentimentVariant(sentiment: SentimentType): 'default' | 'warning' | 'danger' | 'success' | 'info' {
		switch (sentiment) {
			case 'alarming':
				return 'danger';
			case 'critical':
				return 'warning';
			case 'negative':
				return 'warning';
			case 'positive':
				return 'success';
			default:
				return 'default';
		}
	}

	function formatScore(score: number): string {
		if (score > 0) return `+${(score * 100).toFixed(0)}`;
		return (score * 100).toFixed(0);
	}

	function getOverallLabel(sentiment: SentimentType): string {
		switch (sentiment) {
			case 'alarming': return 'HIGH TENSION';
			case 'critical': return 'ELEVATED';
			case 'negative': return 'CONCERNING';
			case 'positive': return 'STABLE';
			case 'neutral': return 'NEUTRAL';
		}
	}
</script>

<Panel id="narrative" title="Global Sentiment" {loading} {error}>
	{#if news.length === 0 && !loading && !error}
		<div class="empty-state">Insufficient data for sentiment analysis</div>
	{:else if sentimentAnalysis}
		<div class="sentiment-content">
			<!-- Overall Sentiment Gauge -->
			<div class="overall-sentiment">
				<div class="sentiment-gauge" style="border-color: {getSentimentColor(sentimentAnalysis.overall)}">
					<span class="gauge-emoji">{getSentimentEmoji(sentimentAnalysis.overall)}</span>
					<span class="gauge-label">{getOverallLabel(sentimentAnalysis.overall)}</span>
					<span class="gauge-score" style="color: {getSentimentColor(sentimentAnalysis.overall)}">
						{formatScore(sentimentAnalysis.overallScore)}
					</span>
				</div>
			</div>

			<!-- Sentiment Distribution -->
			<div class="section">
				<div class="section-title">Sentiment Distribution</div>
				<div class="distribution-bar">
					{#if sentimentAnalysis.distribution.alarming > 0}
						<div 
							class="dist-segment alarming" 
							style="flex: {sentimentAnalysis.distribution.alarming}"
							title="Alarming: {sentimentAnalysis.distribution.alarming}"
						></div>
					{/if}
					{#if sentimentAnalysis.distribution.critical > 0}
						<div 
							class="dist-segment critical" 
							style="flex: {sentimentAnalysis.distribution.critical}"
							title="Critical: {sentimentAnalysis.distribution.critical}"
						></div>
					{/if}
					{#if sentimentAnalysis.distribution.negative > 0}
						<div 
							class="dist-segment negative" 
							style="flex: {sentimentAnalysis.distribution.negative}"
							title="Negative: {sentimentAnalysis.distribution.negative}"
						></div>
					{/if}
					{#if sentimentAnalysis.distribution.neutral > 0}
						<div 
							class="dist-segment neutral" 
							style="flex: {sentimentAnalysis.distribution.neutral}"
							title="Neutral: {sentimentAnalysis.distribution.neutral}"
						></div>
					{/if}
					{#if sentimentAnalysis.distribution.positive > 0}
						<div 
							class="dist-segment positive" 
							style="flex: {sentimentAnalysis.distribution.positive}"
							title="Positive: {sentimentAnalysis.distribution.positive}"
						></div>
					{/if}
				</div>
				<div class="distribution-legend">
					<span class="legend-item"><span class="dot alarming"></span> Alarming ({sentimentAnalysis.distribution.alarming})</span>
					<span class="legend-item"><span class="dot critical"></span> Critical ({sentimentAnalysis.distribution.critical})</span>
					<span class="legend-item"><span class="dot negative"></span> Negative ({sentimentAnalysis.distribution.negative})</span>
					<span class="legend-item"><span class="dot neutral"></span> Neutral ({sentimentAnalysis.distribution.neutral})</span>
					<span class="legend-item"><span class="dot positive"></span> Positive ({sentimentAnalysis.distribution.positive})</span>
				</div>
			</div>

			<!-- Top Themes -->
			{#if sentimentAnalysis.themes.length > 0}
				<div class="section">
					<div class="section-title">Active Geopolitical Themes</div>
					<div class="themes-grid">
						{#each sentimentAnalysis.themes as theme}
							<div class="theme-tag" style="border-left: 3px solid {getSentimentColor(theme.sentiment)}">
								<span class="theme-emoji">{getSentimentEmoji(theme.sentiment)}</span>
								<span class="theme-name">{theme.theme}</span>
								<span class="theme-count">{theme.count}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Top Headlines with Sentiment -->
			<div class="section">
				<div class="section-title">Top Headlines Analysis</div>
				<div class="headlines-list">
					{#each sentimentAnalysis.topHeadlines.slice(0, 15) as item}
						<div class="headline-item">
							<span class="headline-sentiment">{getSentimentEmoji(item.sentiment)}</span>
							<a href={item.headline.link} target="_blank" rel="noopener" class="headline-text">
								{item.headline.title?.slice(0, 80)}{item.headline.title && item.headline.title.length > 80 ? '...' : ''}
							</a>
							{#if item.keywords.length > 0}
								<div class="headline-keywords">
									{item.keywords.slice(0, 3).join(', ')}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<div class="empty-state">No headlines available for analysis</div>
	{/if}
</Panel>

<style>
	.sentiment-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.overall-sentiment {
		display: flex;
		justify-content: center;
		padding: 0.5rem 0;
	}

	.sentiment-gauge {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem 1.5rem;
		background: rgba(255, 255, 255, 0.03);
		border: 2px solid;
		border-radius: 8px;
		min-width: 120px;
	}

	.gauge-emoji {
		font-size: 1.5rem;
		margin-bottom: 0.25rem;
	}

	.gauge-label {
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--text-primary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.gauge-score {
		font-size: 0.75rem;
		font-weight: 700;
		margin-top: 0.15rem;
	}

	.section {
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border);
	}

	.section:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.section-title {
		font-size: 0.6rem;
		font-weight: 600;
		color: var(--accent);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.4rem;
	}

	.distribution-bar {
		display: flex;
		height: 12px;
		border-radius: 6px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.1);
		margin-bottom: 0.4rem;
	}

	.dist-segment {
		transition: flex 0.3s ease;
	}

	.dist-segment.alarming { background: #ff4444; }
	.dist-segment.critical { background: #ff8800; }
	.dist-segment.negative { background: #ffaa44; }
	.dist-segment.neutral { background: #888888; }
	.dist-segment.positive { background: #44cc66; }

	.distribution-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		font-size: 0.5rem;
		color: var(--text-muted);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}

	.dot.alarming { background: #ff4444; }
	.dot.critical { background: #ff8800; }
	.dot.negative { background: #ffaa44; }
	.dot.neutral { background: #888888; }
	.dot.positive { background: #44cc66; }

	.themes-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.theme-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.25rem 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 4px;
		font-size: 0.55rem;
	}

	.theme-emoji {
		font-size: 0.6rem;
	}

	.theme-name {
		color: var(--text-primary);
		font-weight: 500;
	}

	.theme-count {
		font-size: 0.5rem;
		color: var(--text-muted);
		background: rgba(255, 255, 255, 0.1);
		padding: 0.1rem 0.25rem;
		border-radius: 2px;
	}

	.headlines-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.headline-item {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: 0.3rem;
		padding: 0.3rem 0;
		border-bottom: 1px solid var(--border);
	}

	.headline-item:last-child {
		border-bottom: none;
	}

	.headline-sentiment {
		font-size: 0.6rem;
		flex-shrink: 0;
	}

	.headline-text {
		font-size: 0.6rem;
		color: var(--text-primary);
		text-decoration: none;
		line-height: 1.3;
		flex: 1;
	}

	.headline-text:hover {
		color: var(--accent);
		text-decoration: underline;
	}

	.headline-keywords {
		width: 100%;
		font-size: 0.5rem;
		color: var(--text-muted);
		padding-left: 1.1rem;
		font-style: italic;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
