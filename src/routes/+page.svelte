<script lang="ts">
	import { MapPanel } from '$lib/components/panels';
	import {
		TerminalBar,
		StatusStrip,
		EntityTable,
		NewsTape,
		Section
	} from '$lib/components/terminal';
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
			<Section title="Map" hint="click a hotspot or news cluster for detail">
				<MapPanel monitors={$monitors.monitors} news={$allNewsItems} />
			</Section>
			<Section title="News tape">
				<div class="tape-scroll">
					<NewsTape items={$allNewsItems} />
				</div>
			</Section>
		</div>

		<Section title="Everything we track" hint="counts are headlines in the current feeds">
			<EntityTable index={$entityIndex} />
		</Section>
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
