<script lang="ts">
	import '../app.css';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="layout-wrapper">
	{@render children()}
</div>

<style>
	.layout-wrapper {
		min-height: 100vh;
		width: 100%;
		max-width: 100%;
		background: var(--bg);
		color: var(--text);
	}
</style>
