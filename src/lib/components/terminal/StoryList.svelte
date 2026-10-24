<script lang="ts">
	import type { Story } from '$lib/analysis/stories';
	import { formatAgo } from '$lib/utils';

	interface Props {
		stories: Story[];
		limit?: number;
	}

	let { stories, limit = 8 }: Props = $props();

	let showAll = $state(false);
	const visible = $derived(showAll ? stories : stories.slice(0, limit));
</script>

{#each visible as story, i (`${i}-${story.headline.link}`)}
	<div class="t-story">
		<a href={story.headline.link} target="_blank" rel="noopener noreferrer">
			<div class="t-story-title">{story.headline.title}</div>
		</a>
		<div class="t-story-meta">
			{story.sources.length} source{story.sources.length === 1 ? '' : 's'}
			· {story.items.length} headline{story.items.length === 1 ? '' : 's'}
			· latest {formatAgo(story.lastSeen)}
			{#if story.alertCount > 0}· <span class="t-down">{story.alertCount} alert</span>{/if}
		</div>
		{#if story.items.length > 1}
			<ul class="t-also">
				{#each story.items.slice(0, 4) as item, j (`${j}-${item.link}`)}
					<li>
						<a href={item.link} target="_blank" rel="noopener noreferrer">
							{item.source}: {item.title}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{:else}
	<div class="t-slot">No headlines in the current feeds mention this.</div>
{/each}

{#if stories.length > limit}
	<button class="t-filter" type="button" onclick={() => (showAll = !showAll)}>
		{showAll ? 'Show fewer' : `Show all ${stories.length} stories`}
	</button>
{/if}
