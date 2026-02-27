<script lang="ts">
	import Modal from './Modal.svelte';
	import { keywordsStore } from '$lib/stores/keywords';
	import { ALERT_KEYWORDS } from '$lib/config/keywords';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open = false, onClose }: Props = $props();

	let newKeyword = $state('');
	let useCustom = $state($keywordsStore.enabled);
	let keywords = $state<string[]>([...$keywordsStore.custom]);

	// Sync with store when modal opens
	$effect(() => {
		if (open) {
			useCustom = $keywordsStore.enabled;
			keywords = [...$keywordsStore.custom];
			newKeyword = '';
		}
	});

	function handleAddKeyword(e: Event) {
		e.preventDefault();
		const trimmed = newKeyword.trim().toLowerCase();
		if (trimmed && !keywords.includes(trimmed)) {
			keywords = [...keywords, trimmed];
			newKeyword = '';
		}
	}

	function handleRemoveKeyword(keyword: string) {
		keywords = keywords.filter((k) => k !== keyword);
	}

	function handleSave() {
		keywordsStore.setCustomKeywords(keywords);
		if (useCustom !== $keywordsStore.enabled) {
			keywordsStore.toggleEnabled();
		}
		onClose();
	}

	function handleReset() {
		keywords = Array.from(ALERT_KEYWORDS);
		useCustom = false;
	}

	function handleCancel() {
		// Reset to store state
		keywords = [...$keywordsStore.custom];
		useCustom = $keywordsStore.enabled;
		onClose();
	}
</script>

<Modal {open} title="Alert Keywords Settings" onClose={handleCancel}>
	<div class="keywords-settings">
		<div class="settings-info">
			<p>News articles matching these keywords will be highlighted as alerts.</p>
		</div>

		<div class="form-group">
			<label class="checkbox-label">
				<input type="checkbox" bind:checked={useCustom} />
				<span>Use custom keywords (default: system keywords)</span>
			</label>
		</div>

		<div class="form-group">
			<div class="label">Keywords ({keywords.length})</div>
			<div class="keywords-list">
				{#each keywords as keyword (keyword)}
					<div class="keyword-tag">
						<span>{keyword}</span>
						<button
							type="button"
							class="keyword-remove"
							onclick={() => handleRemoveKeyword(keyword)}
							aria-label="Remove keyword"
						>
							×
						</button>
					</div>
				{/each}
			</div>
		</div>

		<form class="keyword-add-form" onsubmit={handleAddKeyword}>
			<input
				type="text"
				bind:value={newKeyword}
				placeholder="Add new keyword..."
				maxlength="50"
			/>
			<button type="submit" class="btn-add">Add</button>
		</form>

		<div class="modal-actions">
			<button type="button" class="btn-secondary" onclick={handleReset}>Reset to Defaults</button>
			<div class="actions-right">
				<button type="button" class="btn-secondary" onclick={handleCancel}>Cancel</button>
				<button type="button" class="btn-primary" onclick={handleSave}>Save</button>
			</div>
		</div>
	</div>
</Modal>

<style>
	.keywords-settings {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.settings-info {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin: 0;
		padding: 0.75rem;
		background: rgba(100, 200, 255, 0.08);
		border-radius: 4px;
		border-left: 3px solid var(--accent);
	}

	.settings-info p {
		margin: 0;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-weight: normal;
	}

	.checkbox-label input[type='checkbox'] {
		cursor: pointer;
	}

	.keywords-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0.75rem;
		background: var(--background);
		border: 1px solid var(--border);
		border-radius: 4px;
		min-height: 100px;
		max-height: 200px;
		overflow-y: auto;
	}

	.keyword-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.3rem 0.5rem;
		background: rgba(100, 200, 255, 0.15);
		border: 1px solid rgba(100, 200, 255, 0.3);
		border-radius: 3px;
		font-size: 0.7rem;
		color: var(--text-primary);
		height: fit-content;
	}

	.keyword-remove {
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0;
		font-size: 1rem;
		line-height: 1;
		opacity: 0.7;
	}

	.keyword-remove:hover {
		opacity: 1;
		color: var(--danger);
	}

	.keyword-add-form {
		display: flex;
		gap: 0.5rem;
	}

	.keyword-add-form input {
		flex: 1;
		padding: 0.5rem;
		background: var(--background);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-primary);
		font-size: 0.75rem;
	}

	.keyword-add-form input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.btn-add {
		padding: 0.5rem 1rem;
		background: var(--accent);
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.btn-add:hover {
		background: var(--accent-hover);
	}

	.modal-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border);
	}

	.actions-right {
		display: flex;
		gap: 0.5rem;
	}

	.btn-primary {
		padding: 0.5rem 1rem;
		background: var(--accent);
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.btn-primary:hover {
		background: var(--accent-hover);
	}

	.btn-secondary {
		padding: 0.5rem 1rem;
		background: transparent;
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.05);
	}
</style>
