<script lang="ts">
	import { Panel } from '$lib/components/common';

	interface Channel {
		id: string;
		name: string;
		channelId: string;
	}

	const channels: Channel[] = [
		{ id: 'aljazeera', name: 'Al Jazeera', channelId: 'UCNye-wNBqNL5ZzHSJdpkDEA' },
		{ id: 'france24', name: 'France 24', channelId: 'UCQfwfsi5VrQ8yKZ-UWmAoBw' },
		{ id: 'dw', name: 'DW News', channelId: 'UCknLrEdhRCp1aegoMqRaCZg' },
		{ id: 'euronews', name: 'Euronews', channelId: 'UCg4QNBEjAWbzM1wBBJ20oeA' },
		{ id: 'bloomberg', name: 'Bloomberg', channelId: 'UCIALMKvObZNtJ6AmdCLP7Lg' }
	];

	let selectedChannel = $state(channels[0]);

	const embedUrl = $derived(
		`https://www.youtube.com/embed/live_stream?channel=${selectedChannel.channelId}&autoplay=1&mute=1`
	);
</script>

<Panel id="livetv" title="Live TV">
	{#snippet header()}
		<div class="channel-tabs">
			{#each channels as channel (channel.id)}
				<button
					class="channel-btn"
					class:active={selectedChannel.id === channel.id}
					onclick={() => (selectedChannel = channel)}
				>
					{channel.name}
				</button>
			{/each}
		</div>
	{/snippet}

	<div class="tv-container">
		<iframe
			src={embedUrl}
			title="{selectedChannel.name} Live"
			allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
			allowfullscreen
		></iframe>
	</div>
	<p class="tv-note">⚠ Stream availability depends on YouTube. Muted by default.</p>
</Panel>

<style>
	.channel-tabs {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
		padding: 0.25rem 0;
	}

	.channel-btn {
		padding: 0.15rem 0.4rem;
		font-size: 0.55rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--border);
		border-radius: 3px;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.channel-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--text-primary);
	}

	.channel-btn.active {
		background: rgba(var(--accent-rgb), 0.15);
		border-color: var(--accent);
		color: var(--accent);
	}

	.tv-container {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
	}

	.tv-container iframe {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: none;
	}

	.tv-note {
		font-size: 0.55rem;
		color: var(--text-muted);
		text-align: center;
		margin: 0.4rem 0 0;
		opacity: 0.7;
	}
</style>
