<script lang="ts">
	import Modal from './Modal.svelte';
	import { marketSettings, customMarkets } from '$lib/stores';
	import { INDICES, SECTORS, COMMODITIES, CRYPTO } from '$lib/config/markets';
	import type { MarketDisplaySettings } from '$lib/stores';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let draggedItem: { category: keyof MarketDisplaySettings; symbol: string } | null = $state(null);
	let newSymbol = $state('');
	let newName = $state('');
	let addError = $state('');

	const categoryConfigs = {
		indices: INDICES,
		sectors: SECTORS,
		commodities: COMMODITIES,
		crypto: CRYPTO
	};

	const categoryLabels: Record<string, string> = {
		indices: 'Index',
		sectors: 'Sector',
		commodities: 'Commodity',
		crypto: 'Crypto',
		custom: 'Custom'
	};

	function getMarketName(category: keyof MarketDisplaySettings, symbol: string): string {
		if (category === 'custom') {
			return $customMarkets.get(symbol) || symbol;
		}
		const config = (categoryConfigs as any)[category];
		if (!config) return symbol;
		return config.find((c: any) => c.symbol === symbol)?.name || symbol;
	}

	function handleToggle(category: keyof MarketDisplaySettings, symbol: string) {
		marketSettings.toggleMarket(category, symbol);
	}

	function handleDragStart(category: keyof MarketDisplaySettings, symbol: string) {
		draggedItem = { category, symbol };
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'move';
	}

	function handleDrop(category: keyof MarketDisplaySettings, targetSymbol: string) {
		if (!draggedItem || draggedItem.category !== category) return;

		const orderedMarkets = $marketSettings[category].order;
		const draggedIndex = orderedMarkets.indexOf(draggedItem.symbol);
		const targetIndex = orderedMarkets.indexOf(targetSymbol);

		if (draggedIndex === -1 || targetIndex === -1) return;

		const newOrder = [...orderedMarkets];
		newOrder.splice(draggedIndex, 1);
		newOrder.splice(targetIndex, 0, draggedItem.symbol);

		marketSettings.reorderMarkets(category, newOrder);
		draggedItem = null;
	}

	function handleReset() {
		if (confirm('Reset all markets to defaults?')) {
			marketSettings.reset();
		}
	}

	function handleAddMarket() {
		addError = '';
		const symbol = newSymbol.trim().toUpperCase();
		const name = newName.trim() || symbol;

		if (!symbol) {
			addError = 'Symbol is required';
			return;
		}

		// Check if symbol already exists
		const allSymbols = [
			...INDICES.map((i) => i.symbol),
			...SECTORS.map((s) => s.symbol),
			...COMMODITIES.map((c) => c.symbol),
			...CRYPTO.map((c) => c.symbol),
			...$marketSettings.custom.order
		];

		if (allSymbols.includes(symbol)) {
			addError = 'Symbol already exists';
			return;
		}

		marketSettings.addCustomMarket(symbol, name);
		newSymbol = '';
		newName = '';
	}

	function handleRemoveCustom(symbol: string) {
		marketSettings.removeCustomMarket(symbol);
	}

	// Build combined list of all markets with categories
	const allMarkets = $derived.by(() => {
		const combined: Array<{
			category: keyof MarketDisplaySettings;
			symbol: string;
			isCustom: boolean;
		}> = [];

		const categories: Array<keyof MarketDisplaySettings> = [
			'indices',
			'sectors',
			'commodities',
			'crypto',
			'custom'
		];

		categories.forEach((cat) => {
			$marketSettings[cat].order.forEach((symbol) => {
				combined.push({ category: cat, symbol, isCustom: cat === 'custom' });
			});
		});

		return combined;
	});
</script>

<Modal {open} title="Market Settings" {onClose}>
	<div class="markets-config">
		<div class="config-content">
			<div class="info">
				<small>Check/uncheck to show/hide markets. Drag to reorder.</small>
			</div>

			<div class="markets-list">
				{#each allMarkets as { category, symbol, isCustom } (category + symbol)}
					<div
						class="market-item"
						draggable={true}
						ondragstart={() => handleDragStart(category, symbol)}
						ondragover={handleDragOver}
						ondrop={() => handleDrop(category, symbol)}
						class:disabled={!$marketSettings[category].enabled.includes(symbol)}
						class:dragging={draggedItem?.symbol === symbol}
					>
						<label class="market-label">
							<input
								type="checkbox"
								checked={$marketSettings[category].enabled.includes(symbol)}
								onchange={() => handleToggle(category, symbol)}
								class="checkbox"
							/>
							<span class="drag-handle">⋮⋮</span>
							<span class="market-name">{getMarketName(category, symbol)}</span>
							<span class="market-category">{categoryLabels[category]}</span>
							{#if isCustom}
								<button
									class="remove-btn"
									onclick={() => handleRemoveCustom(symbol)}
									title="Remove"
								>
									×
								</button>
							{/if}
						</label>
					</div>
				{/each}
			</div>

			<div class="add-market">
				<div class="add-title">Add Custom Market</div>
				<div class="add-form">
					<input
						type="text"
						placeholder="Symbol (e.g. AAPL)"
						bind:value={newSymbol}
						class="add-input"
					/>
					<input
						type="text"
						placeholder="Name (optional)"
						bind:value={newName}
						class="add-input"
					/>
					<button class="add-btn" onclick={handleAddMarket}>Add</button>
				</div>
				{#if addError}
					<div class="add-error">{addError}</div>
				{/if}
			</div>
		</div>

		<div class="actions">
			<button class="btn-secondary" onclick={handleReset}>Reset to Defaults</button>
		</div>
	</div>
</Modal>

<style>
	.markets-config {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.config-content {
		min-height: 200px;
		max-height: 400px;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.info {
		color: var(--text-muted);
		font-size: 0.65rem;
		padding: 0 0.5rem;
	}

	.markets-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem 0;
	}

	.market-item {
		padding: 0.5rem;
		border-radius: 4px;
		background: var(--surface);
		border: 1px solid var(--border);
		cursor: move;
		transition: all 0.2s;
	}

	.market-item:hover {
		background: var(--surface-hover);
		border-color: var(--accent);
	}

	.market-item.dragging {
		opacity: 0.5;
		background: var(--accent);
		border-color: var(--accent);
	}

	.market-item.disabled {
		opacity: 0.5;
	}

	.market-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		width: 100%;
		font-size: 0.75rem;
	}

	.checkbox {
		width: 16px;
		height: 16px;
		cursor: pointer;
		accent-color: var(--accent);
		flex-shrink: 0;
	}

	.drag-handle {
		color: var(--text-muted);
		font-size: 0.6rem;
		user-select: none;
		flex-shrink: 0;
	}

	.market-name {
		flex: 1;
		color: var(--text);
	}

	.market-category {
		color: var(--text-muted);
		font-size: 0.65rem;
		padding: 0.15rem 0.4rem;
		background: var(--surface-hover);
		border-radius: 2px;
		flex-shrink: 0;
	}

	.remove-btn {
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: 1px solid var(--border);
		border-radius: 3px;
		color: var(--text-muted);
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.remove-btn:hover {
		background: var(--red);
		border-color: var(--red);
		color: white;
	}

	.add-market {
		padding: 0.75rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 6px;
	}

	.add-title {
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--text);
		margin-bottom: 0.5rem;
	}

	.add-form {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		width: 100%;
		box-sizing: border-box;
	}

	.add-input {
		flex: 1;
		min-width: 0;
		padding: 0.4rem 0.6rem;
		background: var(--background);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text);
		font-size: 0.7rem;
		box-sizing: border-box;
	}

	.add-input::placeholder {
		color: var(--text-muted);
	}

	.add-input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.add-btn {
		padding: 0.4rem 0.75rem;
		background: var(--accent);
		border: none;
		border-radius: 4px;
		color: white;
		font-size: 0.7rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.add-btn:hover {
		filter: brightness(1.1);
	}

	.add-error {
		color: var(--red);
		font-size: 0.65rem;
		margin-top: 0.4rem;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border);
	}

	.btn-secondary {
		padding: 0.5rem 1rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-secondary:hover {
		background: var(--surface-hover);
		border-color: var(--accent);
	}
</style>
