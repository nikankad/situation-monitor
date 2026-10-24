<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		/** Small dimmed note on the right of the heading */
		hint?: string;
		children: Snippet;
	}

	let { title, hint, children }: Props = $props();
</script>

<section class="t-sec">
	<div class="t-sec-head">
		<span class="t-label">{title}</span>
		{#if hint}<span class="t-dim">{hint}</span>{/if}
	</div>
	{@render children()}
</section>
