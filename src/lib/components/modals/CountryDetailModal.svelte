<script lang="ts">
	import Modal from './Modal.svelte';
	import type { CountryInfo, CountryNews } from '$lib/types';
	import { fetchCountryNews } from '$lib/api/countries';

	interface Props {
		country: CountryInfo | null;
		open: boolean;
		onClose: () => void;
	}

	let { country, open, onClose }: Props = $props();

	let news = $state<CountryNews[]>([]);
	let loadingNews = $state(false);
	let newsError = $state<string | null>(null);

	// Fetch news when country changes and modal is open
	$effect(() => {
		if (open && country) {
			loadNews();
		} else {
			news = [];
			newsError = null;
		}
	});

	async function loadNews() {
		if (!country) return;
		loadingNews = true;
		newsError = null;
		try {
			news = await fetchCountryNews(country.name);
		} catch (err) {
			newsError = 'Failed to load news';
			console.error('Error fetching country news:', err);
		} finally {
			loadingNews = false;
		}
	}

	function formatPopulation(pop: number): string {
		if (pop >= 1_000_000_000) {
			return (pop / 1_000_000_000).toFixed(2) + 'B';
		}
		if (pop >= 1_000_000) {
			return (pop / 1_000_000).toFixed(1) + 'M';
		}
		if (pop >= 1_000) {
			return (pop / 1_000).toFixed(1) + 'K';
		}
		return pop.toString();
	}
</script>

{#if country}
	<Modal {open} title={country.name} {onClose}>
		<div class="country-detail">
			<div class="country-header">
				<span class="country-flag">{country.flag}</span>
				<div class="country-header-info">
					<h3 class="country-name">{country.name}</h3>
					<div class="country-region">{country.region}</div>
					{#if country.capital}
						<div class="country-capital">Capital: {country.capital}</div>
					{/if}
				</div>
			</div>

			<div class="country-meta-row">
				{#if country.population}
					<div class="meta-item">
						<span class="meta-label">Population</span>
						<span class="meta-value">{formatPopulation(country.population)}</span>
					</div>
				{/if}
				{#if country.gdp}
					<div class="meta-item">
						<span class="meta-label">GDP</span>
						<span class="meta-value">${formatPopulation(country.gdp)}</span>
					</div>
				{/if}
				{#if country.government}
					<div class="meta-item">
						<span class="meta-label">Government</span>
						<span class="meta-value">{country.government}</span>
					</div>
				{/if}
			</div>

			{#if country.isSanctioned}
				<div class="sanctioned-badge">
					Sanctioned Country
				</div>
			{/if}

			{#if country.description}
				<div class="section">
					<h4 class="section-title">Overview</h4>
					<p class="description-text">{country.description}</p>
				</div>
			{/if}

			{#if country.leader}
				<div class="section">
					<h4 class="section-title">Current Leader</h4>
					<div class="leader-info">
						<span class="leader-name">{country.leader.name}</span>
						<span class="leader-title">{country.leader.title}</span>
					</div>
				</div>
			{/if}

			{#if country.threats && country.threats.length > 0}
				<div class="section">
					<h4 class="section-title">Current Situation</h4>
					<div class="threats-list">
						{#each country.threats as threat}
							<span class="threat-tag {threat.level}">{threat.description}</span>
						{/each}
					</div>
				</div>
			{/if}

			<div class="section">
				<h4 class="section-title">Latest News</h4>
				{#if loadingNews}
					<div class="loading-news">Loading news...</div>
				{:else if newsError}
					<div class="news-error">{newsError}</div>
				{:else if news.length === 0}
					<div class="no-news">No recent news found</div>
				{:else}
					<div class="news-list">
						{#each news.slice(0, 8) as item}
							<a href={item.link} target="_blank" rel="noopener noreferrer" class="news-item">
								<span class="news-title">{item.title}</span>
								<span class="news-source">{item.source}</span>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</Modal>
{/if}

<style>
	.country-detail {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.country-header {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border);
	}

	.country-flag {
		font-size: 3rem;
		line-height: 1;
	}

	.country-header-info {
		flex: 1;
	}

	.country-name {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0;
		color: var(--text-primary);
	}

	.country-region {
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}

	.country-capital {
		font-size: 0.7rem;
		color: var(--text-muted);
		margin-top: 0.25rem;
	}

	.country-meta-row {
		display: flex;
		gap: 1.5rem;
		padding: 0.75rem;
		background: var(--surface-hover);
		border-radius: 6px;
		flex-wrap: wrap;
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.meta-label {
		font-size: 0.6rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.meta-value {
		font-size: 0.8rem;
		color: var(--text-primary);
		font-weight: 500;
	}

	.sanctioned-badge {
		background: rgba(255, 68, 68, 0.15);
		color: #ff4444;
		padding: 0.5rem 0.75rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-align: center;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.section-title {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin: 0;
	}

	.description-text {
		font-size: 0.8rem;
		color: var(--text-primary);
		line-height: 1.5;
		margin: 0;
	}

	.leader-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.leader-name {
		font-size: 0.85rem;
		color: var(--text-primary);
		font-weight: 500;
	}

	.leader-title {
		font-size: 0.7rem;
		color: var(--text-muted);
	}

	.threats-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.threat-tag {
		font-size: 0.7rem;
		padding: 0.3rem 0.6rem;
		border-radius: 4px;
	}

	.threat-tag.critical {
		background: rgba(255, 0, 0, 0.15);
		color: #ff4444;
	}

	.threat-tag.high {
		background: rgba(255, 68, 68, 0.15);
		color: #ff6644;
	}

	.threat-tag.elevated {
		background: rgba(255, 204, 0, 0.15);
		color: #ffcc00;
	}

	.threat-tag.low {
		background: rgba(0, 255, 136, 0.15);
		color: #00ff88;
	}

	.news-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.news-item {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.5rem;
		background: var(--surface-hover);
		border-radius: 4px;
		text-decoration: none;
		transition: background 0.2s;
	}

	.news-item:hover {
		background: var(--border);
	}

	.news-title {
		font-size: 0.75rem;
		color: var(--text-primary);
		line-height: 1.3;
	}

	.news-source {
		font-size: 0.6rem;
		color: var(--text-muted);
	}

	.loading-news,
	.no-news,
	.news-error {
		font-size: 0.75rem;
		color: var(--text-muted);
		padding: 0.5rem;
		text-align: center;
	}

	.news-error {
		color: #ff4444;
	}
</style>
