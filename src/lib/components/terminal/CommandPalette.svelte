<script lang="ts">
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import {
		ENTITIES,
		entityKey,
		entityPath,
		ENTITY_TYPE_LABELS,
		type Entity
	} from '$lib/config/entities';
	import { entityIndex } from '$lib/stores/entities';
	import { paletteOpen } from '$lib/stores/palette';

	const MAX_RESULTS = 12;
	const TYPE_ORDER: Record<Entity['type'], number> = {
		region: 0,
		asset: 1,
		topic: 2,
		person: 3,
		narrative: 4
	};

	let query = $state('');
	let selected = $state(0);
	let input = $state<HTMLInputElement | null>(null);

	function score(entity: Entity, text: string): number {
		const name = entity.name.toLowerCase();
		if (name === text) return 100;
		if (name.startsWith(text)) return 80;
		if (name.split(/\s+/).some((word) => word.startsWith(text))) return 60;
		if (name.includes(text)) return 40;
		if (entity.aliases.some((alias) => alias.toLowerCase().includes(text))) return 20;
		return 0;
	}

	const results = $derived.by<Entity[]>(() => {
		if (!$paletteOpen) return [];

		const text = query.trim().toLowerCase();
		if (!text) {
			// Nothing typed yet: offer whatever is most active right now. The index is read
			// once here rather than subscribed to, so a closed palette never triggers rebuilds.
			const index = get(entityIndex);
			return ENTITIES.filter((e) => index.has(entityKey(e)))
				.sort((a, b) => index.get(entityKey(b))!.count - index.get(entityKey(a))!.count)
				.slice(0, MAX_RESULTS);
		}
		return ENTITIES.map((entity) => ({ entity, value: score(entity, text) }))
			.filter((r) => r.value > 0)
			.sort((a, b) => b.value - a.value || TYPE_ORDER[a.entity.type] - TYPE_ORDER[b.entity.type])
			.slice(0, MAX_RESULTS)
			.map((r) => r.entity);
	});

	$effect(() => {
		// Reset the highlight whenever the results change
		void results;
		selected = 0;
	});

	$effect(() => {
		if ($paletteOpen) {
			query = '';
			queueMicrotask(() => input?.focus());
		}
	});

	function close(): void {
		paletteOpen.set(false);
	}

	function open(entity: Entity): void {
		close();
		void goto(`${base}${entityPath(entity)}`);
	}

	function isTyping(target: EventTarget | null): boolean {
		const el = target as HTMLElement | null;
		return (
			!!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable === true)
		);
	}

	function onKeydown(event: KeyboardEvent): void {
		if (!$paletteOpen) {
			const shortcut = event.key === '/' && !isTyping(event.target);
			const combo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
			if (shortcut || combo) {
				event.preventDefault();
				paletteOpen.set(true);
			}
			return;
		}

		if (event.key === 'Escape') {
			close();
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			selected = Math.min(selected + 1, results.length - 1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			selected = Math.max(selected - 1, 0);
		} else if (event.key === 'Enter' && results[selected]) {
			event.preventDefault();
			open(results[selected]);
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if $paletteOpen}
	<div class="t-pal">
		<button
			class="t-pal-backdrop"
			type="button"
			tabindex="-1"
			aria-label="Close search"
			onclick={close}
		></button>
		<div class="t-pal-box" role="dialog" aria-modal="true" aria-label="Find an entity">
			<input
				bind:this={input}
				bind:value={query}
				type="text"
				autocomplete="off"
				spellcheck="false"
				placeholder="Type a region, topic, asset or person"
				aria-label="Search"
			/>
			<ul role="listbox">
				{#each results as entity, i (entityKey(entity))}
					<li
						role="option"
						aria-selected={i === selected}
						onmouseenter={() => (selected = i)}
						onclick={() => open(entity)}
						onkeydown={() => {}}
					>
						<span>{entity.name}</span>
						<span class="t-tag" class:asset={entity.type === 'asset'}>
							{ENTITY_TYPE_LABELS[entity.type]}
						</span>
					</li>
				{:else}
					<li class="t-muted" role="option" aria-selected="false">No match</li>
				{/each}
			</ul>
			<div class="t-pal-foot t-label">↑ ↓ to move · enter to open · esc to close</div>
		</div>
	</div>
{/if}
