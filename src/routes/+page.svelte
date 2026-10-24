<script lang="ts">
	import { MapPanel } from '$lib/components/panels';
	import { TerminalBar, StatusStrip, EntityTable, NewsTape } from '$lib/components/terminal';
	import { allNewsItems, monitors } from '$lib/stores';
	import { entityIndex } from '$lib/stores/entities';
</script>

<svelte:head>
	<title>Situation Monitor</title>
	<meta
		name="description"
		content="Regions, topics, assets and people from live news feeds, with a map and a page for each"
	/>
</svelte:head>

<div class="t-page">
	<div class="t-wrap">
		<TerminalBar current="overview" />

		<StatusStrip index={$entityIndex} />

		<div class="t-cols">
			<section class="t-sec">
				<div class="t-sec-head">
					<span class="t-label">Map</span>
					<span class="t-dim">click a hotspot or news cluster for detail</span>
				</div>
				<MapPanel monitors={$monitors.monitors} news={$allNewsItems} />
			</section>
			<aside class="t-sec">
				<div class="t-sec-head"><span class="t-label">News tape</span></div>
				<div class="tape-scroll">
					<NewsTape items={$allNewsItems} />
				</div>
			</aside>
		</div>

		<section class="t-sec">
			<div class="t-sec-head">
				<span class="t-label">Everything we track</span>
				<span class="t-dim">counts are headlines in the current feeds</span>
			</div>
			<EntityTable index={$entityIndex} />
		</section>
	</div>
</div>

<style>
	/* Keep the tape level with the map on wide screens; it scrolls on its own */
	@media (min-width: 961px) {
		.tape-scroll {
			max-height: 560px;
			overflow-y: auto;
			padding-right: 6px;
		}
	}
</style>
