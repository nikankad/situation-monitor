<script lang="ts">
	import Modal from './Modal.svelte';
	import { watchlist, watchlistStocks, watchlistCrypto } from '$lib/stores/watchlist';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open = false, onClose }: Props = $props();

	// Form state for adding new items
	let newStockSymbol = $state('');
	let newStockName = $state('');
	let newCryptoId = $state('');
	let newCryptoName = $state('');

	// Active tab
	let activeTab = $state<'stocks' | 'crypto'>('stocks');

	function handleAddStock() {
		if (!newStockSymbol.trim() || !newStockName.trim()) return;

		watchlist.addItem({
			symbol: newStockSymbol.trim().toUpperCase(),
			name: newStockName.trim(),
			type: 'stock'
		});

		newStockSymbol = '';
		newStockName = '';
	}

	function handleAddCrypto() {
		if (!newCryptoId.trim() || !newCryptoName.trim()) return;

		watchlist.addItem({
			symbol: newCryptoId.trim().toLowerCase(),
			name: newCryptoName.trim(),
			type: 'crypto'
		});

		newCryptoId = '';
		newCryptoName = '';
	}

	function handleRemoveStock(symbol: string) {
		watchlist.removeItem(symbol, 'stock');
	}

	function handleRemoveCrypto(symbol: string) {
		watchlist.removeItem(symbol, 'crypto');
	}

	function handleReset() {
		watchlist.reset();
	}

	function handleKeydown(e: KeyboardEvent, action: () => void) {
		if (e.key === 'Enter') {
			action();
		}
	}
</script>

<Modal {open} title="Markets Watchlist" {onClose}>
	<div class="markets-options">
		<div class="tabs">
			<button
				class="tab"
				class:active={activeTab === 'stocks'}
				onclick={() => (activeTab = 'stocks')}
			>
				Stocks ({$watchlistStocks.length})
			</button>
			<button
				class="tab"
				class:active={activeTab === 'crypto'}
				onclick={() => (activeTab = 'crypto')}
			>
				Crypto ({$watchlistCrypto.length})
			</button>
		</div>

		{#if activeTab === 'stocks'}
			<div class="tab-content">
				<div class="add-form">
					<div class="form-row">
						<input
							type="text"
							placeholder="Symbol (e.g. AAPL)"
							bind:value={newStockSymbol}
							onkeydown={(e) => handleKeydown(e, handleAddStock)}
							class="input symbol-input"
						/>
						<input
							type="text"
							placeholder="Name (e.g. Apple)"
							bind:value={newStockName}
							onkeydown={(e) => handleKeydown(e, handleAddStock)}
							class="input name-input"
						/>
						<button
							class="add-btn"
							onclick={handleAddStock}
							disabled={!newStockSymbol.trim() || !newStockName.trim()}
						>
							Add
						</button>
					</div>
				</div>

				<div class="items-list">
					{#if $watchlistStocks.length === 0}
						<div class="empty-state">No stocks in watchlist</div>
					{:else}
						{#each $watchlistStocks as item (item.symbol)}
							<div class="item">
								<span class="item-symbol">{item.symbol}</span>
								<span class="item-name">{item.name}</span>
								<button
									class="remove-btn"
									onclick={() => handleRemoveStock(item.symbol)}
									title="Remove"
								>
									×
								</button>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{:else}
			<div class="tab-content">
				<div class="add-form">
					<div class="form-row">
						<input
							type="text"
							placeholder="ID (e.g. bitcoin)"
							bind:value={newCryptoId}
							onkeydown={(e) => handleKeydown(e, handleAddCrypto)}
							class="input symbol-input"
						/>
						<input
							type="text"
							placeholder="Name (e.g. Bitcoin)"
							bind:value={newCryptoName}
							onkeydown={(e) => handleKeydown(e, handleAddCrypto)}
							class="input name-input"
						/>
						<button
							class="add-btn"
							onclick={handleAddCrypto}
							disabled={!newCryptoId.trim() || !newCryptoName.trim()}
						>
							Add
						</button>
					</div>
					<p class="form-hint">
						Use CoinGecko IDs (e.g. bitcoin, ethereum, solana, cardano, dogecoin)
					</p>
				</div>

				<div class="items-list">
					{#if $watchlistCrypto.length === 0}
						<div class="empty-state">No crypto in watchlist</div>
					{:else}
						{#each $watchlistCrypto as item (item.symbol)}
							<div class="item">
								<span class="item-symbol">{item.symbol}</span>
								<span class="item-name">{item.name}</span>
								<button
									class="remove-btn"
									onclick={() => handleRemoveCrypto(item.symbol)}
									title="Remove"
								>
									×
								</button>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/if}

		<div class="actions">
			<button class="reset-btn" onclick={handleReset}> Reset to Default </button>
		</div>
	</div>
</Modal>

<style>
	.markets-options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		border-bottom: 1px solid var(--border);
		padding-bottom: 0.5rem;
	}

	.tab {
		padding: 0.4rem 0.8rem;
		background: none;
		border: 1px solid transparent;
		border-radius: 4px;
		color: var(--text-secondary);
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.tab:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.tab.active {
		background: rgba(0, 255, 136, 0.1);
		border-color: var(--accent);
		color: var(--accent);
	}

	.tab-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.add-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-row {
		display: flex;
		gap: 0.5rem;
	}

	.input {
		padding: 0.4rem 0.6rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-primary);
		font-size: 0.7rem;
		outline: none;
		transition: border-color 0.15s ease;
	}

	.input:focus {
		border-color: var(--accent);
	}

	.input::placeholder {
		color: var(--text-muted);
	}

	.symbol-input {
		width: 100px;
		text-transform: uppercase;
	}

	.name-input {
		flex: 1;
	}

	.form-hint {
		font-size: 0.6rem;
		color: var(--text-muted);
		margin: 0;
	}

	.add-btn {
		padding: 0.4rem 0.8rem;
		background: rgba(0, 255, 136, 0.1);
		border: 1px solid var(--accent);
		border-radius: 4px;
		color: var(--accent);
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.add-btn:hover:not(:disabled) {
		background: rgba(0, 255, 136, 0.2);
	}

	.add-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-height: 250px;
		overflow-y: auto;
	}

	.item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.6rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 4px;
	}

	.item-symbol {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-primary);
		min-width: 60px;
	}

	.item-name {
		flex: 1;
		font-size: 0.65rem;
		color: var(--text-secondary);
	}

	.remove-btn {
		width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: 1px solid transparent;
		border-radius: 3px;
		color: var(--text-muted);
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.remove-btn:hover {
		background: rgba(255, 68, 68, 0.1);
		border-color: rgba(255, 68, 68, 0.3);
		color: var(--red);
	}

	.empty-state {
		text-align: center;
		color: var(--text-muted);
		font-size: 0.7rem;
		padding: 1rem;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		padding-top: 0.5rem;
		border-top: 1px solid var(--border);
	}

	.reset-btn {
		padding: 0.4rem 0.8rem;
		background: rgba(255, 68, 68, 0.1);
		border: 1px solid rgba(255, 68, 68, 0.3);
		border-radius: 4px;
		color: var(--red);
		font-size: 0.65rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.reset-btn:hover {
		background: rgba(255, 68, 68, 0.2);
	}
</style>
