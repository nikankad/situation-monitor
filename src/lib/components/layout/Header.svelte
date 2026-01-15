<script lang="ts">
	import { isRefreshing, lastRefresh } from '$lib/stores';

	interface Props {
		onSettingsClick?: () => void;
	}

	let { onSettingsClick }: Props = $props();

	const lastRefreshText = $derived(
		$lastRefresh
			? `Last updated: ${new Date($lastRefresh).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} (local)`
			: 'Never refreshed'
	);

	// World time zones to display
	const timeZones = [
		{ label: 'UTC', zone: 'UTC' },
		{ label: 'EST', zone: 'America/New_York' },
		{ label: 'PST', zone: 'America/Los_Angeles' },
		{ label: 'GMT', zone: 'Europe/London' },
		{ label: 'CET', zone: 'Europe/Paris' },
		{ label: 'MSK', zone: 'Europe/Moscow' },
		{ label: 'IST', zone: 'Asia/Kolkata' },
		{ label: 'CST', zone: 'Asia/Shanghai' },
		{ label: 'JST', zone: 'Asia/Tokyo' }
	];

	// Update time every minute
	let currentTime = $state(new Date());
	$effect(() => {
		const interval = setInterval(() => {
			currentTime = new Date();
		}, 60000); // Update every minute
		return () => clearInterval(interval);
	});

	function formatTimeForZone(zone: string): string {
		return currentTime.toLocaleTimeString('en-US', {
			timeZone: zone,
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
	}
</script>

<div class="header-wrapper">
	<header class="header">
		<div class="header-left">
			<h1 class="logo">SITUATION MONITOR</h1>
		</div>

		<div class="header-center"></div>

		<div class="header-right">
			<button class="header-btn settings-btn" onclick={onSettingsClick} title="Settings">
				<span class="btn-icon">⚙</span>
				<span class="btn-label">Settings</span>
			</button>
		</div>
	</header>
</div>

<div class="time-zones">
	<div class="time-zones-list">
		{#each timeZones as tz}
			<div class="time-zone">
				<span class="tz-label">{tz.label}</span>
				<span class="tz-time">{formatTimeForZone(tz.zone)}</span>
			</div>
		{/each}
	</div>
	<div class="refresh-status-subtle">
		{#if $isRefreshing}
			<span class="refresh-indicator">●</span>
		{/if}
		<span class="status-text-subtle">{lastRefreshText}</span>
	</div>
</div>

<style>
	.header-wrapper {
		z-index: 100;
		background: var(--surface);
		border-bottom: 1px solid var(--border);
	}

	.time-zones {
		position: sticky;
		top: 0;
		z-index: 100;
		background: var(--surface);
		border-bottom: 1px solid var(--border);
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		gap: 1rem;
	}

	.header-left {
		display: flex;
		align-items: baseline;
		flex-shrink: 0;
	}

	.logo {
		font-size: 0.9rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: var(--text-primary);
		margin: 0;
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.header-center {
		flex: 1;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.header-btn {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		min-height: 2.75rem;
		padding: 0.4rem 0.75rem;
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
		font-size: 0.65rem;
	}

	.header-btn:hover {
		background: var(--border);
		color: var(--text-primary);
	}

	.btn-icon {
		font-size: 0.8rem;
	}

	.btn-label {
		display: none;
	}

	@media (min-width: 768px) {
		.btn-label {
			display: inline;
		}
	}

	.time-zones {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.3rem 1rem;
		background: var(--bg);
		border-top: 1px solid var(--border);
		gap: 1rem;
	}

	.time-zones-list {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		flex: 1;
		flex-wrap: wrap;
	}

	.time-zone {
		display: flex;
		align-items: baseline;
		gap: 0.3rem;
		font-size: 0.65rem;
	}

	.refresh-status-subtle {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		flex-shrink: 0;
	}

	.refresh-indicator {
		color: var(--accent);
		font-size: 0.5rem;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}

	.status-text-subtle {
		font-size: 0.55rem;
		color: var(--text-muted);
		opacity: 0.6;
	}

	.tz-label {
		color: var(--text-muted);
		font-weight: 600;
		letter-spacing: 0.05em;
	}

	.tz-time {
		color: var(--text-secondary);
		font-family: 'Courier New', monospace;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.time-zones {
			flex-direction: column;
			gap: 0.3rem;
			padding: 0.25rem 0.5rem;
		}

		.time-zones-list {
			gap: 0.5rem;
		}

		.time-zone {
			font-size: 0.6rem;
		}

		.refresh-status-subtle {
			align-self: flex-end;
		}

		.status-text-subtle {
			font-size: 0.5rem;
		}
	}
</style>
