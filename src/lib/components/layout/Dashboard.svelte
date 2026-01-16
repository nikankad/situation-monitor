<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Drag-drop state and handlers will be added in Phase 4
	// when panels are fully implemented
</script>

<main class="dashboard">
	<div class="dashboard-grid">
		{@render children()}
	</div>
</main>

<style>
	.dashboard {
		padding: 0.5rem;
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: auto;
		grid-auto-rows: 450px;
		gap: 0.5rem;
		max-width: 2000px;
		margin: 0 auto;
	}

	/* Map slot spans full width, first row, auto height */
	.dashboard-grid > :global(.map-slot) {
		grid-column: 1 / -1;
		grid-row: 1;
		height: auto;
	}

	/* All panel slots get fixed height */
	.dashboard-grid > :global(.panel-slot:not(.map-slot)) {
		height: 450px;
		min-height: 0;
	}

	@media (min-width: 600px) {
		.dashboard-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 900px) {
		.dashboard-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (min-width: 1200px) {
		.dashboard-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	@media (min-width: 1600px) {
		.dashboard-grid {
			grid-template-columns: repeat(5, 1fr);
		}
	}

	@media (min-width: 2000px) {
		.dashboard-grid {
			grid-template-columns: repeat(6, 1fr);
		}
	}
</style>
