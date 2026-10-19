<script lang="ts">
	import { Panel, MarketItemDetailed } from '$lib/components/common';
	import { MarketsConfigModal } from '$lib/components/modals';
	import { connections } from '$lib/stores/connections';
	import { indices, sectors, commodities, crypto, custom, marketSettings } from '$lib/stores';

	let configModalOpen = $state(false);

	const indicesItems = $derived($indices.items);
	const sectorsItems = $derived($sectors.items);
	const commoditiesItems = $derived($commodities.items);
	const cryptoItems = $derived($crypto.items);
	const customItems = $derived($custom.items);
	const error = $derived($indices.error || $sectors.error || $commodities.error || $crypto.error || $custom.error);

	// Get all enabled and ordered markets across all categories
	const allOrderedItems = $derived(() => {
		const items: Array<{ item: any; type: string; typeName: string }> = [];

		// Add indices
		const enabledIndices = $marketSettings.indices.order.filter((symbol) =>
			$marketSettings.indices.enabled.includes(symbol)
		);
		const indicesItemMap = new Map(indicesItems.map((i) => [i.symbol, i]));
		enabledIndices.forEach((symbol) => {
			const item = indicesItemMap.get(symbol);
			if (item) items.push({ item, type: 'indices', typeName: 'Index' });
		});

		// Add sectors
		const enabledSectors = $marketSettings.sectors.order.filter((symbol) =>
			$marketSettings.sectors.enabled.includes(symbol)
		);
		const sectorsItemMap = new Map(sectorsItems.map((s) => [s.symbol, s]));
		enabledSectors.forEach((symbol) => {
			const item = sectorsItemMap.get(symbol);
			if (item) items.push({ item, type: 'sectors', typeName: 'Sector' });
		});

		// Add commodities
		const enabledCommodities = $marketSettings.commodities.order.filter((symbol) =>
			$marketSettings.commodities.enabled.includes(symbol)
		);
		const commoditiesItemMap = new Map(commoditiesItems.map((c) => [c.symbol, c]));
		enabledCommodities.forEach((symbol) => {
			const item = commoditiesItemMap.get(symbol);
			if (item) items.push({ item, type: 'commodities', typeName: 'Commodity' });
		});

		// Add crypto - transform to match MarketItem interface
		const enabledCrypto = $marketSettings.crypto.order.filter((symbol) =>
			$marketSettings.crypto.enabled.includes(symbol)
		);
		const cryptoItemMap = new Map(cryptoItems.map((c) => [c.symbol, c]));
		enabledCrypto.forEach((symbol) => {
			const cryptoItem = cryptoItemMap.get(symbol);
			if (cryptoItem) {
				// Transform CryptoItem to MarketItem format
				const transformedItem: any = {
					symbol: cryptoItem.symbol,
					name: cryptoItem.name,
					price: cryptoItem.current_price || 0,
					change: cryptoItem.price_change_24h || 0,
					changePercent: (cryptoItem.price_change_24h || 0),
					type: 'crypto' as const,
					high: NaN,
					low: NaN,
					open: NaN,
					previousClose: NaN
				};
				items.push({ item: transformedItem, type: 'crypto', typeName: 'Crypto' });
			}
		});

		// Add custom markets
		const enabledCustom = $marketSettings.custom.order.filter((symbol) =>
			$marketSettings.custom.enabled.includes(symbol)
		);
		const customItemMap = new Map(customItems.map((c) => [c.symbol, c]));
		enabledCustom.forEach((symbol) => {
			const item = customItemMap.get(symbol);
			if (item) {
				items.push({ item, type: 'custom', typeName: 'Custom' });
			}
		});

		return items;
	});

</script>

<Panel id="markets" title="Markets" {error}>
	{#if !$connections.some((key) => key.provider === 'finnhub')}
		<p class="connection-notice">Add your Finnhub key in Settings to enable market quotes. Crypto prices use a public source.</p>
	{/if}
	{#snippet actions()}
		<button
			class="settings-btn"
			onclick={() => (configModalOpen = true)}
			title="Configure markets"
		>
			⚙
		</button>
	{/snippet}
	{#if allOrderedItems().length === 0 && !error}
		<div class="empty-state">No market data available</div>
	{:else}
		<div class="markets-list">
			{#each allOrderedItems() as { item } (item.symbol)}
				<MarketItemDetailed {item} />
			{/each}
		</div>
	{/if}
</Panel>

<MarketsConfigModal open={configModalOpen} onClose={() => (configModalOpen = false)} />

<style>
	.connection-notice { padding: .75rem; font-size: .7rem; color: var(--text-secondary); line-height: 1.6; }
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

	.markets-list {
		display: flex;
		flex-direction: column;
	}

	.empty-state {
		text-align: center;
		color: var(--text-muted);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
