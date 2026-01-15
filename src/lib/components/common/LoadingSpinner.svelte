<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		message?: string;
	}

	let { size = 'md', message = '' }: Props = $props();
</script>

<div class="loading-container {size}">
	<div class="spinner"></div>
	{#if message}
		<div class="message">{message}</div>
	{/if}
</div>

<style>
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		gap: 0.5rem;
	}

	.spinner {
		border: 2px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.sm .spinner {
		width: 16px;
		height: 16px;
	}

	.md .spinner {
		width: 24px;
		height: 24px;
	}

	.lg .spinner {
		width: 32px;
		height: 32px;
		border-width: 3px;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.message {
		font-size: 0.7rem;
		color: var(--text-secondary);
	}

	.sm .message {
		font-size: 0.6rem;
	}

	.lg .message {
		font-size: 0.8rem;
	}
</style>
