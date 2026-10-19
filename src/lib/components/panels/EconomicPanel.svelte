<script lang="ts">
	import { Panel } from '$lib/components/common';
	let { refreshVersion = 0 }: { refreshVersion?: number } = $props();
	const series = [
		{ id: 'GDP', label: 'US GDP', unit: 'billion USD' },
		{ id: 'CPIAUCSL', label: 'Consumer price index', unit: 'index' },
		{ id: 'UNRATE', label: 'Unemployment', unit: '%' },
		{ id: 'FEDFUNDS', label: 'Federal funds rate', unit: '%' }
	];
	let readings = $state<{ label: string; value: string; date: string; unit: string }[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	$effect(() => {
		void refreshVersion;
		const controller = new AbortController();
		loading = true;
		error = null;
		Promise.all(
			series.map(async (item) => {
				const response = await fetch(`/api/fred?series_id=${item.id}`, {
					signal: controller.signal
				});
				if (!response.ok)
					throw new Error(
						response.status === 409
							? 'Add your FRED API key in Settings to see economic indicators.'
							: 'Economic data unavailable. Check your FRED key in Settings or try again later.'
					);
				const data = await response.json();
				const latest = data.observations.find(
					(observation: { value: string }) => observation.value !== '.'
				);
				return {
					label: item.label,
					unit: item.unit,
					value: latest?.value ?? '—',
					date: latest?.date ?? ''
				};
			})
		)
			.then((values) => {
				if (!controller.signal.aborted) readings = values;
			})
			.catch((reason) => {
				if (!controller.signal.aborted) {
					readings = [];
					error = reason.message;
				}
			})
			.finally(() => {
				if (!controller.signal.aborted) loading = false;
			});
		return () => controller.abort();
	});
</script>

<Panel id="economics" title="Economic Indicators" {error} status={loading ? 'Loading…' : 'FRED'}>
	<div class="readings">
		{#each readings as reading}
			<div>
				<span>{reading.label}</span><strong>{reading.value} <small>{reading.unit}</small></strong
				><time>{reading.date}</time>
			</div>
		{/each}
	</div>
</Panel>

<style>
	.readings {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		padding: 1rem;
	}
	.readings div {
		display: grid;
		gap: 0.5rem;
	}
	span {
		font-size: 0.7rem;
		color: var(--text-secondary);
	}
	strong {
		font-size: 1.1rem;
		font-weight: 500;
	}
	small,
	time {
		font-size: 0.6rem;
		color: var(--text-muted);
	}
</style>
