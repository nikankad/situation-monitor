<script lang="ts">
	import '../app.css';
	import '$lib/styles/terminal.css';
	import { onMount } from 'svelte';
	import { startDataLoading } from '$lib/services/dataLoader';
	import { appReady } from '$lib/stores/misc';
	import { CommandPalette } from '$lib/components/terminal';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	onMount(() => startDataLoading());
</script>

<div class="layout-wrapper">
	{#if $appReady}
		{@render children()}
		<CommandPalette />
	{:else}
		<div class="loading-screen">
			<div class="loading-content">
				<div class="logo-container">
					<div class="radar-circle"></div>
					<div class="radar-circle radar-circle-2"></div>
					<div class="radar-circle radar-circle-3"></div>
					<div class="radar-sweep"></div>
				</div>
				<h1 class="loading-title">SITUATION MONITOR</h1>
			</div>
		</div>
	{/if}
</div>

<style>
	.layout-wrapper {
		min-height: 100vh;
		width: 100%;
		max-width: 100%;
		background: var(--bg);
		color: var(--text);
	}

	.loading-screen {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg);
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.loading-content {
		text-align: center;
		padding: 2rem;
		animation: slideUp 0.6s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.logo-container {
		position: relative;
		width: 120px;
		height: 120px;
		margin: 0 auto 2rem;
	}

	.radar-circle {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border: 2px solid var(--accent);
		border-radius: 50%;
		opacity: 0.3;
	}

	.radar-circle {
		width: 60px;
		height: 60px;
		animation: radarPulse 2s ease-out infinite;
	}

	.radar-circle-2 {
		width: 80px;
		height: 80px;
		animation-delay: 0.3s;
	}

	.radar-circle-3 {
		width: 100px;
		height: 100px;
		animation-delay: 0.6s;
	}

	@keyframes radarPulse {
		0% {
			transform: translate(-50%, -50%) scale(0.5);
			opacity: 0.8;
		}
		100% {
			transform: translate(-50%, -50%) scale(1.5);
			opacity: 0;
		}
	}

	.radar-sweep {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: conic-gradient(from 0deg, var(--accent) 0deg 90deg, transparent 90deg 360deg);
		transform: translate(-50%, -50%);
		animation: radarSweep 2s linear infinite;
		mask: radial-gradient(circle, transparent 45%, black 45%);
		-webkit-mask: radial-gradient(circle, transparent 45%, black 45%);
	}

	@keyframes radarSweep {
		0% {
			transform: translate(-50%, -50%) rotate(0deg);
		}
		100% {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}

	.loading-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--accent);
		letter-spacing: 0.2em;
		margin-bottom: 2rem;
		text-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
		animation: titleGlow 2s ease-in-out infinite;
	}

	@keyframes titleGlow {
		0%,
		100% {
			text-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
		}
		50% {
			text-shadow: 0 0 30px rgba(0, 255, 136, 0.6);
		}
	}
</style>
