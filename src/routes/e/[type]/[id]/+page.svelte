<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { getEntity } from '$lib/config/entities';
	import { EntityView, TerminalBar } from '$lib/components/terminal';

	// Derived from the route so moving between entity pages updates this one in place
	const entity = $derived(getEntity(page.params.type ?? '', page.params.id ?? ''));
</script>

<svelte:head>
	<title>{entity ? `${entity.name} · Situation Monitor` : 'Not found · Situation Monitor'}</title>
</svelte:head>

{#if entity}
	<EntityView {entity} />
{:else}
	<div class="t-page">
		<div class="t-wrap">
			<TerminalBar current="entity" />
			<div class="t-sec">
				<p class="t-prose">Nothing is tracked under that name.</p>
				<a class="t-chip" href="{base}/">Back to the overview</a>
			</div>
		</div>
	</div>
{/if}
