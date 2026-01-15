<script lang="ts">
	import type { MarketItem as MarketItemType } from '$lib/types';
	import { formatPercentChange, getChangeClass } from '$lib/utils';

	interface Props {
		item: MarketItemType;
	}

	let { item }: Props = $props();

	const isDataAvailable = $derived(!isNaN(item.price) && item.price !== null);
	const changeClass = $derived(isDataAvailable ? getChangeClass(item.changePercent) : '');

	const priceDisplay = $derived(
		!isDataAvailable
			? '—'
			: item.price > 100
				? item.price.toLocaleString('en-US', { maximumFractionDigits: 2 })
				: item.price.toFixed(2)
	);

	const changeText = $derived(isDataAvailable ? formatPercentChange(item.changePercent) : '—');
	const absoluteChange = $derived(
		isDataAvailable && !isNaN(item.change)
			? (item.change >= 0 ? '+' : '') + item.change.toFixed(2)
			: '—'
	);

	const formatPrice = (price: number | undefined) => {
		if (price === undefined || isNaN(price)) return '—';
		return price > 100
			? price.toLocaleString('en-US', { maximumFractionDigits: 2 })
			: price.toFixed(2);
	};

	const hasOHLCData = $derived(
		!isNaN(item.open || NaN) ||
		!isNaN(item.high || NaN) ||
		!isNaN(item.low || NaN) ||
		!isNaN(item.previousClose || NaN)
	);
</script>

<div class="market-item-detailed">
	<div class="header-row">
		<div class="name-section">
			<span class="symbol">{item.symbol.replace('^', '')}</span>
			<span class="name">{item.name}</span>
		</div>
		<div class="price-section">
			<span class="price" class:unavailable={!isDataAvailable}>${priceDisplay}</span>
			<span class="change {changeClass}" class:unavailable={!isDataAvailable}>
				{absoluteChange} ({changeText})
			</span>
		</div>
	</div>

	{#if hasOHLCData}
		<div class="stats-row">
			<div class="stat">
				<span class="stat-label">Open</span>
				<span class="stat-value">${formatPrice(item.open)}</span>
			</div>
			<div class="stat">
				<span class="stat-label">High</span>
				<span class="stat-value">${formatPrice(item.high)}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Low</span>
				<span class="stat-value">${formatPrice(item.low)}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Prev</span>
				<span class="stat-value">${formatPrice(item.previousClose)}</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.market-item-detailed {
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--border);
	}

	.market-item-detailed:last-child {
		border-bottom: none;
	}

	.header-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.5rem;
	}

	.name-section {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.symbol {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text);
		letter-spacing: 0.02em;
	}

	.name {
		font-size: 0.6rem;
		color: var(--text-muted);
	}

	.price-section {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.1rem;
	}

	.price {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text);
		font-variant-numeric: tabular-nums;
	}

	.change {
		font-size: 0.6rem;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}

	.change.up {
		color: var(--green);
	}

	.change.down {
		color: var(--red);
	}

	.unavailable {
		color: var(--text-muted);
		opacity: 0.5;
	}

	.stats-row {
		display: flex;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.stat-label {
		font-size: 0.5rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 0.6rem;
		color: var(--text-dim);
		font-variant-numeric: tabular-nums;
	}
</style>
