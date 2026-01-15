<script lang="ts">
	interface Props {
		text: string;
		variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
		size?: 'sm' | 'md';
	}

	let { text, variant = 'default', size = 'sm' }: Props = $props();
</script>

<span class="badge {variant} {size}">{text}</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		border-radius: 3px;
	}

	.sm {
		font-size: 0.5rem;
		padding: 0.1rem 0.3rem;
	}

	.md {
		font-size: 0.6rem;
		padding: 0.15rem 0.4rem;
	}

	.default {
		background: rgba(255, 255, 255, 0.1);
		color: var(--text-secondary);
	}

	.success {
		background: rgba(68, 255, 136, 0.15);
		color: var(--success);
	}

	.warning {
		background: rgba(255, 165, 0, 0.15);
		color: #ffa500;
	}

	.danger {
		background: rgba(255, 68, 68, 0.15);
		color: var(--danger);
	}

	.info {
		background: rgba(var(--accent-rgb), 0.15);
		color: var(--accent);
	}
</style>
