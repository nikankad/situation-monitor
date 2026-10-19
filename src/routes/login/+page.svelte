<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	let busy = $state(false);
	let failed = $state(false);

	async function login() {
		busy = true;
		failed = false;
		try {
			await signIn('google', { redirectTo: '/' });
		} catch {
			failed = true;
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Sign in · Situation Monitor</title>
	<meta
		name="description"
		content="Your personal intelligence workspace. Sign in to connect your data sources and customize your dashboard."
	/>
</svelte:head>

<main class="login">
	<div class="brand"><span class="signal"></span> SITUATION MONITOR</div>
	<section class="login-card" aria-labelledby="login-title">
		<div class="eyebrow">YOUR INTELLIGENCE WORKSPACE</div>
		<h1 id="login-title">A global view.<br />Your perspective.</h1>
		<p class="intro">
			News, markets, and global events in one dashboard, configured around what matters to you.
		</p>
		<div class="features">
			<div>
				<span>01</span>
				<p>
					<strong>Connect your sources</strong>Bring your own API keys, stored encrypted on the
					server.
				</p>
			</div>
			<div>
				<span>02</span>
				<p>
					<strong>Make it yours</strong>Save your panels, watchlists, and keyword monitors to your
					account.
				</p>
			</div>
			<div>
				<span>03</span>
				<p><strong>Pick up anywhere</strong>Your settings follow you across devices.</p>
			</div>
		</div>
		<button class="google" onclick={login} disabled={busy || !data.configured}>
			<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"
				><path
					fill="#4285F4"
					d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.61 4.61 0 0 1-2 3.03v2.52h3.23c1.89-1.74 2.99-4.31 2.99-7.38Z"
				/><path
					fill="#34A853"
					d="M12 22c2.7 0 4.96-.9 6.61-2.39l-3.23-2.52c-.89.6-2.03.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.06v2.6A10 10 0 0 0 12 22Z"
				/><path
					fill="#FBBC05"
					d="M6.4 13.92a6 6 0 0 1 0-3.84v-2.6H3.06a10 10 0 0 0 0 9.04l3.34-2.6Z"
				/><path
					fill="#EA4335"
					d="M12 5.95c1.47 0 2.79.51 3.83 1.52L18.7 4.6A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.48l3.34 2.6A5.99 5.99 0 0 1 12 5.95Z"
				/></svg
			>
			{busy ? 'Connecting to Google…' : 'Continue with Google'}
		</button>
		{#if !data.configured}
			<p class="notice" role="status">
				Google sign-in is awaiting setup. Add the Google OAuth credentials and session secret to the
				server environment.
			</p>
		{:else if data.error || failed}
			<p class="notice" role="alert">
				Sign-in could not be completed. Please try again with your Google account.
			</p>
		{/if}
		<p class="footnote">A personal dashboard. Your keys and preferences belong to your account.</p>
	</section>
	<footer>GLOBAL CONTEXT. PERSONAL CONTROL.</footer>
</main>

<style>
	.login {
		min-height: 100vh;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		background: radial-gradient(ellipse at 50% 30%, #10291f 0%, #080d0b 65%);
		color: #edf5f0;
	}
	.brand {
		align-self: flex-start;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.15em;
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}
	.signal {
		width: 10px;
		height: 10px;
		border: 2px solid #70e8a2;
		border-radius: 50%;
		box-shadow: 0 0 0 4px #70e8a21a;
	}
	.login-card {
		width: min(100%, 480px);
		margin: auto;
		padding: 2.5rem 0;
	}
	.eyebrow {
		font-size: 0.65rem;
		letter-spacing: 0.18em;
		color: #70e8a2;
		margin-bottom: 1.3rem;
	}
	h1 {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		font-size: clamp(2.3rem, 7vw, 3.3rem);
		line-height: 1.12;
		letter-spacing: -0.05em;
		font-weight: 500;
		margin: 0;
	}
	.intro {
		color: #a1b4aa;
		font-size: 0.9rem;
		line-height: 1.8;
		margin: 1.4rem 0 2rem;
	}
	.features {
		display: grid;
		gap: 1.3rem;
		margin-bottom: 2.2rem;
	}
	.features div {
		display: flex;
		gap: 1rem;
	}
	.features span {
		color: #6b8b79;
		font-size: 0.65rem;
		padding-top: 0.15rem;
	}
	.features p {
		margin: 0;
		color: #91a99b;
		font-size: 0.75rem;
		line-height: 1.7;
	}
	strong {
		display: block;
		color: #e2eee7;
		font-weight: 500;
		font-size: 0.82rem;
	}
	.google {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.75rem;
		padding: 0.9rem 1rem;
		background: #f4f8f5;
		color: #15251c;
		border: 0;
		border-radius: 6px;
		font-family: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}
	.google:hover:enabled {
		background: #d8f2e1;
	}
	.google:disabled {
		opacity: 0.55;
		cursor: default;
	}
	.google:focus-visible {
		outline: 2px solid #70e8a2;
		outline-offset: 4px;
	}
	.notice {
		font-size: 0.75rem;
		line-height: 1.7;
		color: #f1d6a5;
		border: 1px solid #776443;
		background: #322a1d;
		padding: 0.8rem;
		border-radius: 6px;
		margin-top: 1rem;
	}
	.footnote {
		text-align: center;
		font-size: 0.65rem;
		color: #8ca497;
		margin: 1.2rem 0 0;
		line-height: 1.8;
	}
	footer {
		color: #698574;
		font-size: 0.55rem;
		letter-spacing: 0.2em;
		padding-top: 2rem;
	}
	@media (max-width: 480px) {
		.login {
			padding: 1.5rem;
		}
		.brand {
			font-size: 0.65rem;
		}
		.login-card {
			padding: 3rem 0;
		}
	}
</style>
