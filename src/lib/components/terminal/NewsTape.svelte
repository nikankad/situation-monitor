<script lang="ts">
	import { base } from '$app/paths';
	import { entityPath, matchEntities } from '$lib/config/entities';
	import { dedupeItems } from '$lib/analysis/entity-index';
	import { formatAgo } from '$lib/utils';
	import type { NewsItem } from '$lib/types';

	interface Props {
		items: NewsItem[];
	}

	let { items }: Props = $props();

	const PAGE_SIZE = 20;
	const CHIPS_PER_ITEM = 3;

	let alertsOnly = $state(false);
	let visibleCount = $state(PAGE_SIZE);

	const latest = $derived(dedupeItems(items));

	const shown = $derived(latest.filter((item) => !alertsOnly || item.isAlert));
	const visible = $derived(shown.slice(0, visibleCount));

	// One chip per name, so "Iran" the region and "Iran" the topic do not show twice
	function chipsFor(item: NewsItem) {
		const chips: ReturnType<typeof matchEntities> = [];
		for (const entity of matchEntities(item.title)) {
			if (chips.some((chip) => chip.name === entity.name)) continue;
			chips.push(entity);
			if (chips.length === CHIPS_PER_ITEM) break;
		}
		return chips;
	}
</script>

<div class="t-sec-head">
	<div class="t-filters" role="group" aria-label="Filter the tape">
		<button
			class="t-filter"
			type="button"
			aria-pressed={!alertsOnly}
			onclick={() => {
				alertsOnly = false;
				visibleCount = PAGE_SIZE;
			}}
		>
			All
		</button>
		<button
			class="t-filter"
			type="button"
			aria-pressed={alertsOnly}
			onclick={() => {
				alertsOnly = true;
				visibleCount = PAGE_SIZE;
			}}
		>
			Alerts
		</button>
	</div>
	<span class="t-dim">newest first</span>
</div>

<div class="t-tape">
	{#each visible as item, i (`${i}-${item.link}`)}
		<div style="padding: 8px 0; border-bottom: 1px solid var(--t-line)">
			<div class="t-tape-meta">
				<span>{formatAgo(item.timestamp)}</span>
				<span>{item.source}</span>
				{#if item.isAlert}<span><span class="t-alertdot"></span>ALERT</span>{/if}
			</div>
			<a href={item.link} target="_blank" rel="noopener noreferrer" style="padding: 0; border: 0">
				<div class="t-headline">{item.title}</div>
			</a>
			<div class="t-chips">
				{#each chipsFor(item) as entity (`${entity.type}/${entity.id}`)}
					<a class="t-chip" href="{base}{entityPath(entity)}">{entity.name}</a>
				{/each}
			</div>
		</div>
	{:else}
		<div class="t-slot">{alertsOnly ? 'No alert headlines right now.' : 'No headlines yet.'}</div>
	{/each}
</div>

{#if shown.length > visibleCount}
	<button class="t-filter" type="button" onclick={() => (visibleCount += PAGE_SIZE)}>
		Show more
	</button>
{/if}
