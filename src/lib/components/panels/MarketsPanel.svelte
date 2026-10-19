<script lang="ts">
	import { Panel, MarketItemDetailed } from '$lib/components/common';
	import { MarketsConfigModal } from '$lib/components/modals';
	import { indices, sectors, commodities, crypto, custom, marketSettings } from '$lib/stores';
	import type { MarketItem, CryptoItem } from '$lib/types';

	let configModalOpen = $state(false);

	const error = $derived(
		$indices.error || $sectors.error || $commodities.error || $crypto.error || $custom.error
	);

	type SectionKey = 'indices' | 'sectors' | 'commodities' | 'crypto' | 'custom';

	const SECTION_TITLES: Record<SectionKey, string> = {
		indices: 'Indices',
		sectors: 'Sectors',
		commodities: 'Commodities',
		crypto: 'Crypto',
		custom: 'Watchlist'
	};

	// CoinGecko only gives a 24h percent change; derive the absolute change from it
	function cryptoToMarketItem(c: CryptoItem): MarketItem {
		const pct = c.price_change_percentage_24h || 0;
		const price = c.current_price || NaN;
		return {
			symbol: c.symbol,
			name: c.name,
			price,
			change: price - price / (1 + pct / 100),
			changePercent: pct,
			type: 'crypto'
		};
	}

	// Enabled items in the user's configured order, keyed by symbol
	function orderedEnabled(key: SectionKey, items: MarketItem[]): MarketItem[] {
		const { order, enabled } = $marketSettings[key];
		const bySymbol = new Map(items.map((i) => [i.symbol, i]));
		return order
			.filter((symbol) => enabled.includes(symbol))
			.map((symbol) => bySymbol.get(symbol))
			.filter((i): i is MarketItem => i !== undefined);
	}

	const sections = $derived(
		(
			[
				['indices', $indices.items],
				['sectors', $sectors.items],
				['commodities', $commodities.items],
				['crypto', $crypto.items.map(cryptoToMarketItem)],
				['custom', $custom.items]
			] as [SectionKey, MarketItem[]][]
		)
			.map(([key, items]) => ({
				key,
				title: SECTION_TITLES[key],
				items: orderedEnabled(key, items)
			}))
			.filter((s) => s.items.length > 0)
	);

	const count = $derived(sections.reduce((n, s) => n + s.items.length, 0));

	// Stock quotes come from Finnhub; if every quote is missing the API key is likely absent
	const quotesUnavailable = $derived(
		[...$indices.items, ...$sectors.items, ...$commodities.items].length > 0 &&
			[...$indices.items, ...$sectors.items, ...$commodities.items].every((i) => isNaN(i.price))
	);
</script>

<Panel id="markets" title="Markets" count={count || null} {error}>
	{#snippet actions()}
		<button class="settings-btn" onclick={() => (configModalOpen = true)} title="Configure markets">
			⚙
		</button>
	{/snippet}
	{#if count === 0 && !error}
		<div class="empty-state">No market data available</div>
	{:else}
		{#if quotesUnavailable}
			<div class="notice">Stock quotes unavailable — check the Finnhub API key.</div>
		{/if}
		{#each sections as section (section.key)}
			<div class="section">
				<div class="section-title">{section.title}</div>
				{#each section.items as item (item.symbol)}
					<MarketItemDetailed {item} />
				{/each}
			</div>
		{/each}
	{/if}
</Panel>

<MarketsConfigModal open={configModalOpen} onClose={() => (configModalOpen = false)} />

<style>
	.settings-btn {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-muted);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.settings-btn:hover {
		background: var(--surface-hover);
		border-color: var(--accent);
		color: var(--accent);
	}

	.section + .section {
		margin-top: 0.5rem;
	}

	.section-title {
		position: sticky;
		top: -0.5rem;
		z-index: 1;
		padding: 0.3rem 0;
		background: var(--surface);
		border-bottom: 1px solid var(--border);
		font-size: 0.6rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.notice {
		font-size: 0.6rem;
		color: var(--yellow);
		padding: 0.3rem 0.4rem;
		margin-bottom: 0.4rem;
		border-left: 2px solid var(--yellow);
		background: rgba(255, 170, 0, 0.08);
	}

	.empty-state {
		text-align: center;
		color: var(--text-muted);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
