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

	// Generate color based on change percent
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

	// Calculate treemap layout
	async function generateTreemap() {
		if (items.length === 0) return;

		const d3 = await import('d3');

		// Create hierarchy
		const root = d3.hierarchy({ children: items })
			.sum((d: any) => d.marketCap || 1000)
			.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

		// Calculate treemap
		const treemap = d3.treemap()
			.size([containerWidth, containerHeight])
			.paddingTop(0)
			.paddingRight(4)
			.paddingBottom(0)
			.paddingLeft(4);

		treemap(root);

		// Extract leaf nodes with positioning
		treemapData = root.leaves().map((node: any) => ({
			...node.data,
			x: node.x0,
			y: node.y0,
			width: node.x1 - node.x0,
			height: node.y1 - node.y0
		}));
	}

	// Handle resize
	function handleResize() {
		if (containerRef) {
			containerWidth = containerRef.offsetWidth;
			containerHeight = containerRef.offsetHeight;
			generateTreemap();
		}
	}

	// Watch for items changes
	$effect(() => {
		if (items.length > 0) {
			generateTreemap();
		}
	});

	onMount(() => {
		handleResize();
		const observer = new ResizeObserver(handleResize);
		observer.observe(containerRef);
		return () => observer.disconnect();
	});
</script>

<Panel id="heatmap" title="Sector Heatmap" {error}>
	<div class="heatmap-container" bind:this={containerRef}>
		{#if items.length === 0 && !error}
			<div class="empty-state">No sector data available</div>
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
		border: 1px solid rgba(0, 0, 0, 0.3);
		border-radius: 2px;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: filter 0.15s ease;
		cursor: pointer;
	}

	.treemap-box:hover {
		filter: brightness(1.15);
		border-color: rgba(255, 255, 255, 0.5);
	}

	.box-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		text-align: center;
		width: 100%;
		height: 100%;
	}

	.sector-name {
		font-size: 0.7rem;
		font-weight: 600;
		color: white;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
		line-height: 1;
		margin-bottom: 0.15rem;
	}

	.sector-change {
		font-size: 0.65rem;
		font-weight: 500;
		color: white;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
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

		.sector-change {
			font-size: 0.6rem;
		}
	}
</style>
