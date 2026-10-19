<script lang="ts">
	import { getIconNodes, type IconName } from '$lib/config/icons';

	interface Props {
		name: IconName;
		size?: number;
		strokeWidth?: number;
		class?: string;
		title?: string;
	}

	let { name, size = 16, strokeWidth = 2, class: className = '', title }: Props = $props();

	const nodes = $derived(getIconNodes(name));
</script>

<svg
	class="icon {className}"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	role={title ? 'img' : undefined}
	aria-label={title}
	aria-hidden={title ? undefined : 'true'}
>
	{#each nodes as [tag, attrs], i (i)}
		<svelte:element this={tag} {...attrs} />
	{/each}
</svg>

<style>
	.icon {
		display: inline-block;
		flex-shrink: 0;
		vertical-align: middle;
	}
</style>
