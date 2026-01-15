<script lang="ts">
	interface Props {
		message: string;
		retry?: () => void;
	}

	let { message, retry }: Props = $props();
</script>

<div class="error-container">
	<div class="error-icon">⚠</div>
	<div class="error-message">{message}</div>
	{#if retry}
		<button class="retry-btn" onclick={retry}>Retry</button>
	{/if}
</div>

<style>
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		gap: 0.5rem;
		text-align: center;
	}

	.error-icon {
		font-size: 1.5rem;
		opacity: 0.6;
	}

	.error-message {
		font-size: 0.7rem;
		color: var(--danger);
	}

	.retry-btn {
		font-size: 0.6rem;
		padding: 0.3rem 0.6rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.retry-btn:hover {
		background: var(--border);
		color: var(--text-primary);
	}
</style>
