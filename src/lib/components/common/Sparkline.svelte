<script lang="ts">
	import type { PricePoint } from '$lib/types';

	interface Props {
		data: PricePoint[];
		width?: number;
		height?: number;
		strokeWidth?: number;
		color?: 'auto' | 'up' | 'down' | 'neutral';
	}

	let {
		data,
		width = 100,
		height = 30,
		strokeWidth = 1.5,
		color = 'auto'
	}: Props = $props();

	// Calculate the SVG path and color based on data
	const chartData = $derived(() => {
		if (!data || data.length < 2) {
			return { path: '', strokeColor: 'var(--text-muted)', change: 0 };
		}

		const prices = data.map((d) => d.price);
		const minPrice = Math.min(...prices);
		const maxPrice = Math.max(...prices);
		const priceRange = maxPrice - minPrice || 1;

		// Add padding
		const padding = 2;
		const chartWidth = width - padding * 2;
		const chartHeight = height - padding * 2;

		// Generate SVG path
		const points = data.map((point, i) => {
			const x = padding + (i / (data.length - 1)) * chartWidth;
			const y = padding + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
			return `${x},${y}`;
		});

		const path = `M ${points.join(' L ')}`;

		// Determine color based on price change
		const firstPrice = data[0].price;
		const lastPrice = data[data.length - 1].price;
		const change = lastPrice - firstPrice;

		let strokeColor: string;
		if (color === 'auto') {
			strokeColor = change >= 0 ? 'var(--green)' : 'var(--red)';
		} else if (color === 'up') {
			strokeColor = 'var(--green)';
		} else if (color === 'down') {
			strokeColor = 'var(--red)';
		} else {
			strokeColor = 'var(--text-muted)';
		}

		return { path, strokeColor, change };
	});
</script>

{#if data && data.length >= 2}
	<svg {width} {height} class="sparkline" viewBox="0 0 {width} {height}">
		<path
			d={chartData().path}
			fill="none"
			stroke={chartData().strokeColor}
			stroke-width={strokeWidth}
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{:else}
	<div class="no-data" style="width: {width}px; height: {height}px;">
		<span>No data</span>
	</div>
{/if}

<style>
	.sparkline {
		display: block;
	}

	.no-data {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
		font-size: 0.5rem;
		background: var(--surface);
		border-radius: 2px;
	}
</style>
