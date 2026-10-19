<script lang="ts">
	import { Panel } from '$lib/components/common';
	import type { Contract } from '$lib/api';

	interface Props {
		contracts?: Contract[];
		loading?: boolean;
		error?: string | null;
	}

	let { contracts = [], loading = false, error = null }: Props = $props();

	function formatValue(v: number): string {
		if (v >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B';
		if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
		if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
		return '$' + v.toFixed(0);
	}

	function formatDate(iso: string): string {
		const date = new Date(iso + 'T00:00:00');
		if (isNaN(date.getTime())) return '';
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	// USASpending text is all-caps; convert to sentence case for readability
	function toSentenceCase(text: string): string {
		const lower = text.toLowerCase().trim();
		return lower.charAt(0).toUpperCase() + lower.slice(1);
	}

	function toTitleCase(text: string): string {
		return text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
	}
</script>

<Panel id="contracts" title="Gov Contracts" count={contracts.length || null} {error}>
	{#if contracts.length === 0 && !error}
		<div class="empty-state">{loading ? 'Loading contracts…' : 'No contracts available'}</div>
	{:else}
		<div class="contracts-subtitle">Largest new federal awards · last 30 days</div>
		<div class="contracts-list">
			{#each contracts as contract (contract.id)}
				<a href={contract.url} target="_blank" rel="noopener noreferrer" class="contract-item">
					<div class="contract-header">
						<span class="contract-agency" title={contract.agency}>
							{contract.subAgency || contract.agency}
						</span>
						<span class="contract-value">{formatValue(contract.amount)}</span>
					</div>
					<div class="contract-desc">{toSentenceCase(contract.description)}</div>
					<div class="contract-meta">
						<span class="contract-vendor">{toTitleCase(contract.vendor)}</span>
						<span class="contract-date">{formatDate(contract.date)}</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</Panel>

<style>
	.contracts-subtitle {
		font-size: 0.55rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding-bottom: 0.3rem;
		border-bottom: 1px solid var(--border);
	}

	.contracts-list {
		display: flex;
		flex-direction: column;
	}

	.contract-item {
		display: block;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
		color: inherit;
	}

	.contract-item:hover {
		text-decoration: none;
	}

	.contract-item:hover .contract-desc {
		color: var(--accent);
	}

	.contract-item:last-child {
		border-bottom: none;
	}

	.contract-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.5rem;
		margin-bottom: 0.2rem;
	}

	.contract-agency {
		font-size: 0.55rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.contract-desc {
		font-size: 0.65rem;
		color: var(--text-primary);
		line-height: 1.3;
		margin-bottom: 0.3rem;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.contract-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.55rem;
		color: var(--text-muted);
	}

	.contract-vendor {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.contract-date {
		flex-shrink: 0;
	}

	.contract-value {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--success);
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
