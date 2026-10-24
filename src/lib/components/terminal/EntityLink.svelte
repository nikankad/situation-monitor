<script lang="ts">
	import { base } from '$app/paths';
	import { entityPath, ENTITY_TYPE_LABELS, type Entity } from '$lib/config/entities';

	interface Props {
		entity: Entity;
		/** Show the entity type next to the name, for names that exist as more than one type */
		showType?: boolean;
	}

	let { entity, showType = false }: Props = $props();
</script>

<a href="{base}{entityPath(entity)}">{entity.name}</a>{#if showType}
	<span class="t-tag" class:asset={entity.type === 'asset'}>{ENTITY_TYPE_LABELS[entity.type]}</span
	>{/if}
