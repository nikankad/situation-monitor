<script lang="ts">
	import { onMount } from 'svelte';
	import { Panel } from '$lib/components/common';
	import { sectors } from '$lib/stores';

	const items = $derived($sectors.items);
	const error = $derived($sectors.error);

	let containerRef: HTMLDivElement;
	let treemapData: any[] = [];
	let containerWidth = $state(800);
	let containerHeight = $state(300);

	// Generate color based on change percent (green to red gradient)
	function getColor(changePercent: number): string {
		if (changePercent >= 3) return '#00dd00';
		if (changePercent >= 2) return '#44dd44';
		if (changePercent >= 1) return '#88dd88';
		if (changePercent >= 0.5) return '#aaddaa';
		if (changePercent >= 0) return '#ccddcc';
		if (changePercent >= -0.5) return '#ddcccc';
		if (changePercent >= -1) return '#ddaaaa';
		if (changePercent >= -2) return '#dd6666';
		if (changePercent >= -3) return '#dd4444';
		return '#dd0000';
	}

	// Calculate squarified treemap layout (creates more square boxes)
	async function generateTreemap() {
		// Filter out items with invalid data (NaN prices from failed API calls)
		const validItems = items.filter((item) => !isNaN(item.changePercent));

		if (validItems.length === 0 || containerWidth === 0 || containerHeight === 0) {
			treemapData = [];
			return;
		}

		try {
			const d3 = await import('d3');

			// Create hierarchy with market cap values
			const root = d3.hierarchy({ children: validItems })
				.sum((d: any) => d.marketCap || 1000)
				.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

			// Use squarified treemap for more balanced square-like rectangles
			const treemap = d3.treemapSquarify()
				.size([containerWidth, containerHeight])
				.paddingTop(4)
				.paddingRight(4)
				.paddingBottom(4)
				.paddingLeft(4)
				.round(true);

			treemap(root);

			// Extract leaf nodes with positioning
			const newData = root.leaves().map((node: any) => ({
				...node.data,
				x: Math.round(node.x0),
				y: Math.round(node.y0),
				width: Math.round(node.x1 - node.x0),
				height: Math.round(node.y1 - node.y0)
			}));

			treemapData = newData;
		} catch (err) {
			console.error('Error generating treemap:', err);
		}
	}

	// Handle container resize
	function handleResize() {
		if (containerRef) {
			containerWidth = containerRef.offsetWidth;
			containerHeight = containerRef.offsetHeight;
			generateTreemap();
		}
	}

	// Regenerate treemap when items change
	$effect(() => {
		if (items.length > 0 && containerWidth > 0 && containerHeight > 0) {
			generateTreemap().catch(err => console.error('Error generating treemap:', err));
		}
	});

	onMount(() => {
		// Small delay to ensure container has rendered
		setTimeout(() => {
			handleResize();
		}, 100);

		const observer = new ResizeObserver(handleResize);
		if (containerRef) {
			observer.observe(containerRef);
		}

		return () => observer.disconnect();
	});
</script>

<Panel id="heatmap" title="Sector Heatmap" {error}>
	<div class="heatmap-container" bind:this={containerRef}>
		{#if items.length === 0}
			<div class="empty-state">
				{error ? `Error: ${error}` : 'No sector data available'}
			</div>
		{:else if treemapData.length === 0}
			<div class="empty-state">Loading sector heatmap...</div>
		{:else}
			<div class="treemap" style="width: 100%; height: 100%; position: relative;">
				{#each treemapData as sector (sector.symbol)}
					{@const color = getColor(sector.changePercent)}
					<div
						class="treemap-box"
						style="
							left: {sector.x}px;
							top: {sector.y}px;
							width: {sector.width}px;
							height: {sector.height}px;
							background: {color};
						"
						title="{sector.name}: {sector.changePercent > 0 ? '+' : ''}{sector.changePercent.toFixed(2)}%"
					>
						<div class="box-content">
							<div class="sector-name">{sector.name}</div>
							<div class="sector-symbol">{sector.symbol}</div>
							<div class="sector-change">
								{sector.changePercent > 0 ? '+' : ''}{sector.changePercent.toFixed(2)}%
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</Panel>

<style>
	.heatmap-container {
		width: 100%;
		height: 100%;
		min-height: 250px;
		display: flex;
		flex-direction: column;
	}

	.treemap {
		flex: 1;
		position: relative;
	}

	.treemap-box {
		position: absolute;
		border: 1px solid rgba(0, 0, 0, 0.25);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: filter 0.15s ease;
		cursor: pointer;
	}

	.treemap-box:hover {
		filter: brightness(1.15) drop-shadow(0 0 4px rgba(255, 255, 255, 0.3));
	}

	.box-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		text-align: center;
		width: 100%;
		height: 100%;
	}

	.sector-name {
		font-size: 0.75rem;
		font-weight: 700;
		color: white;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
		line-height: 1;
		margin-bottom: 0.1rem;
	}

	.sector-symbol {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.85);
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
		line-height: 1;
		margin-bottom: 0.05rem;
	}

	.sector-change {
		font-size: 0.7rem;
		font-weight: 600;
		color: white;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
		line-height: 1;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	@media (max-width: 768px) {
		.heatmap-container {
			min-height: 200px;
		}

		.sector-name {
			font-size: 0.65rem;
		}

		.sector-symbol {
			font-size: 0.6rem;
		}

		.sector-change {
			font-size: 0.6rem;
		}
	}
</style>
