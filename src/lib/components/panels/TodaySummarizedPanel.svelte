<script lang="ts">
	import { Panel } from '$lib/components/common';
	import type { NewsItem } from '$lib/types';
	import * as webllm from '@mlc-ai/web-llm';

	interface Props {
		news?: NewsItem[];
		error?: string | null;
	}

	let { news = [], error = null }: Props = $props();

	// WebLLM state
	let engine: webllm.MLCEngine | null = null;
	let isModelLoading = $state(false);
	let isGenerating = $state(false);
	let aiSummary = $state<string>('');
	let initError = $state<string>('');

	// Initialize WebLLM with a lightweight model
	async function initWebLLM() {
		if (engine) return engine;
		
		isModelLoading = true;
		initError = '';
		
		try {
			engine = await webllm.CreateMLCEngine('TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC', {
				initProgressCallback: (progress) => {
					console.log('Model loading progress:', progress);
				}
			});
			return engine;
		} catch (err) {
			initError = `Failed to initialize AI model: ${err}`;
			console.error('WebLLM initialization error:', err);
			return null;
		} finally {
			isModelLoading = false;
		}
	}

	// Generate AI summary
	async function generateAISummary(newsItems: NewsItem[]) {
		if (newsItems.length === 0 || isGenerating) return;
		
		isGenerating = true;
		aiSummary = '';
		
		try {
			const llm = await initWebLLM();
			if (!llm) return;

			// Prepare news data for summarization
			const newsText = newsItems
				.slice(0, 10) // Limit to 10 most recent items
				.map(item => `${item.title} - ${item.source || 'Unknown'}`)
				.join('\n');

			const prompt = `Summarize today's key geopolitical developments in 2-3 sentences. Focus on the most important events and their global implications. Be concise and factual.

Today's news:
${newsText}

Summary:`;

			const response = await llm.chat.completions.create({
				messages: [{ role: 'user', content: prompt }],
				temperature: 0.3,
				max_tokens: 150
			});

			aiSummary = response.choices[0]?.message?.content || 'Unable to generate summary';
		} catch (err) {
			aiSummary = `Error generating summary: ${err}`;
			console.error('Summary generation error:', err);
		} finally {
			isGenerating = false;
		}
	}

	const geopoliticalSummary = $derived.by(() => {
		if (!news || news.length === 0) return null;

		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

		// Filter for today's geopolitical news
		const todayNews = news
			.filter((item) => item.timestamp >= todayStart)
			.filter(
				(item) =>
					item.category === 'politics' ||
					item.category === 'gov' ||
					item.source?.toLowerCase().includes('geopolitics') ||
					item.source?.toLowerCase().includes('conflict')
			)
			.sort((a, b) => b.timestamp - a.timestamp);

		if (todayNews.length === 0) return null;

		// Trigger AI summary generation
		if (todayNews.length > 0 && !aiSummary && !isGenerating && !isModelLoading) {
			generateAISummary(todayNews);
		}

		// Group by region
		const byRegion = new Map<string, NewsItem[]>();
		todayNews.forEach((item) => {
			const region = item.region || 'Global';
			if (!byRegion.has(region)) byRegion.set(region, []);
			byRegion.get(region)!.push(item);
		});

		// Identify alert/critical items
		const alerts = todayNews.filter((item) => item.isAlert);
		const topRegions = Array.from(byRegion.entries())
			.sort((a, b) => b[1].length - a[1].length)
			.slice(0, 4);

		// Generate narrative
		let narrative = '';

		// Opening with alert status
		if (alerts.length > 0) {
			narrative += `${alerts.length} critical alert${alerts.length > 1 ? 's' : ''} have been reported in the geopolitical sphere today. `;
		}

		narrative += `The past 24 hours have seen developments across ${byRegion.size} region${byRegion.size > 1 ? 's' : ''}, with ${todayNews.length} total event${todayNews.length > 1 ? 's' : ''} tracked.`;

		// Key storylines from top regions
		const storylines: string[] = [];
		topRegions.forEach(([region, items]) => {
			if (items.length > 0 && region !== 'Global') {
				const topStory = items[0];
				const storySnippet = topStory.title.split(' ').slice(0, 12).join(' ');
				const intensity = items.length > 3 ? 'intensifying activity' : 'ongoing developments';
				storylines.push(`${region} has seen ${intensity}: ${storySnippet}.`);
			}
		});

		if (storylines.length > 0) {
			narrative += '\n\n';
			narrative += storylines.join(' ');
		}

		// Extract and highlight important keywords
		const keywords = new Map<string, number>();
		todayNews.forEach((item) => {
			const words = item.title.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
			words.forEach((word) => {
				// Filter common words
				if (![
					'said', 'says', 'report', 'reports', 'today', 'would', 'could', 'china', 'states', 'russia',
					'government', 'official', 'spokesman', 'minutes', 'hours', 'according', 'latest', 'breaking'
				].includes(word)) {
					keywords.set(word, (keywords.get(word) || 0) + 1);
				}
			});
		});

		const topKeywords = Array.from(keywords.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 4)
			.map(([word]) => word);

		if (topKeywords.length > 0) {
			narrative += `\n\nDominant themes: ${topKeywords.join(', ')}.`;
		}

		// Add sentiment/tone
		const severity = alerts.length > 0 ? 'elevated' : todayNews.length > 5 ? 'active' : 'moderate';
		narrative += `\n\nOverall geopolitical tension remains ${severity}.`;

		return {
			narrative,
			totalItems: todayNews.length,
			criticalCount: alerts.length,
			regionCount: byRegion.size,
			newsItems: todayNews
		};
	});
</script>

<Panel id="today-summary" title="Today Summarized" {error}>
	{#if news.length === 0 && !error}
		<div class="empty-state">No news data available</div>
	{:else if geopoliticalSummary}
		<div class="summary-content">
			<div class="summary-meta">
				<span class="meta-item">{geopoliticalSummary.totalItems} developments</span>
				<span class="meta-sep">•</span>
				<span class="meta-item">{geopoliticalSummary.regionCount} region{geopoliticalSummary.regionCount > 1 ? 's' : ''}</span>
				{#if geopoliticalSummary.criticalCount > 0}
					<span class="meta-sep">•</span>
					<span class="meta-item critical">{geopoliticalSummary.criticalCount} alert{geopoliticalSummary.criticalCount > 1 ? 's' : ''}</span>
				{/if}
			</div>

			<!-- AI Summary Section -->
			{#if isModelLoading}
				<div class="ai-section loading">
					<div class="ai-header">🤖 AI Summary</div>
					<div class="ai-status">Loading AI model...</div>
				</div>
			{:else if isGenerating}
				<div class="ai-section loading">
					<div class="ai-header">🤖 AI Summary</div>
					<div class="ai-status">Generating summary...</div>
				</div>
			{:else if aiSummary}
				<div class="ai-section">
					<div class="ai-header">🤖 AI Summary</div>
					<div class="ai-content">{aiSummary}</div>
				</div>
			{:else if initError}
				<div class="ai-section error">
					<div class="ai-header">🤖 AI Summary</div>
					<div class="ai-error">{initError}</div>
				</div>
			{/if}

			<!-- Manual summary button if AI hasn't started -->
			{#if !aiSummary && !isGenerating && !isModelLoading && !initError && geopoliticalSummary.newsItems.length > 0}
				<div class="ai-section">
					<button class="generate-btn" onclick={() => generateAISummary(geopoliticalSummary.newsItems)}>
						🤖 Generate AI Summary
					</button>
				</div>
			{/if}

			<div class="narrative">
				{geopoliticalSummary.narrative}
			</div>
		</div>
	{:else}
		<div class="empty-state">No geopolitical developments today</div>
	{/if}
</Panel>

<style>
	.summary-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.summary-meta {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.65rem;
		color: var(--text-secondary);
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border);
	}

	.meta-item {
		font-weight: 500;
		color: var(--text-primary);
	}

	.meta-item.critical {
		color: var(--danger);
		font-weight: 600;
	}

	.meta-sep {
		color: var(--text-muted);
	}

	.ai-section {
		background: rgba(0, 255, 136, 0.05);
		border: 1px solid rgba(0, 255, 136, 0.2);
		border-radius: 6px;
		padding: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.ai-section.loading {
		background: rgba(255, 204, 0, 0.05);
		border-color: rgba(255, 204, 0, 0.2);
	}

	.ai-section.error {
		background: rgba(255, 68, 68, 0.05);
		border-color: rgba(255, 68, 68, 0.2);
	}

	.ai-header {
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--accent);
		margin-bottom: 0.5rem;
	}

	.ai-content {
		font-size: 0.7rem;
		line-height: 1.5;
		color: var(--text-primary);
	}

	.ai-status {
		font-size: 0.65rem;
		color: var(--warning);
		font-style: italic;
	}

	.ai-error {
		font-size: 0.65rem;
		color: var(--danger);
	}

	.generate-btn {
		background: rgba(0, 255, 136, 0.1);
		border: 1px solid rgba(0, 255, 136, 0.3);
		border-radius: 4px;
		padding: 0.4rem 0.75rem;
		color: var(--accent);
		font-size: 0.65rem;
		cursor: pointer;
		transition: all 0.2s ease;
		width: 100%;
	}

	.generate-btn:hover {
		background: rgba(0, 255, 136, 0.2);
		border-color: var(--accent);
	}

	.narrative {
		font-size: 0.7rem;
		line-height: 1.6;
		color: var(--text-primary);
		text-align: left;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
