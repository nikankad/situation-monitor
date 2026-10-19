<script lang="ts">
	import { onMount } from 'svelte';
	import { PROVIDERS, type Provider, type KeyStatus } from '$lib/account';
	import { preferenceSync, flushPreferences } from '$lib/services/preferences';
	import { connections } from '$lib/stores/connections';
	let { onKeysChanged }: { onKeysChanged?: () => void } = $props();
	let keys = $state<KeyStatus[]>([]);
	let drafts = $state<Record<Provider, string>>({ finnhub: '', fred: '' });
	let busy = $state<Provider | null>(null);
	let loading = $state(true);
	let encryptionConfigured = $state(false);
	let message = $state('');
	let failed = $state(false);
	const names = { finnhub: 'Finnhub', fred: 'FRED' };
	const descriptions = {
		finnhub: 'Live stock, index, sector, and commodity quotes.',
		fred: 'GDP, inflation, unemployment, and interest rates from the Federal Reserve.'
	};

	onMount(async () => {
		try {
			const response = await fetch('/api/account/keys');
			if (!response.ok)
				throw new Error('Could not load your connections. Close Settings and try again.');
			const data = await response.json();
			keys = data.keys;
			encryptionConfigured = data.encryptionConfigured;
		} catch (error) {
			failed = true;
			message = String(error instanceof Error ? error.message : error);
		} finally {
			loading = false;
		}
	});

	async function update(provider: Provider, remove = false) {
		busy = provider;
		message = '';
		failed = false;
		try {
			const response = await fetch(`/api/account/keys/${provider}`, {
				method: remove ? 'DELETE' : 'PUT',
				headers: { 'Content-Type': 'application/json' },
				...(remove ? {} : { body: JSON.stringify({ key: drafts[provider] }) })
			});
			if (!response.ok)
				throw new Error(
					response.status === 401
						? 'Your session expired. Sign in again.'
						: 'Could not update your API key. Check the key and try again.'
				);
			keys = (await response.json()).keys;
			connections.set(keys);
			drafts[provider] = '';
			message = `${names[provider]} key ${remove ? 'removed' : 'saved'}.`;
			onKeysChanged?.();
		} catch (error) {
			failed = true;
			message = String(error instanceof Error ? error.message : error);
		} finally {
			busy = null;
		}
	}
</script>

<section aria-labelledby="account-title">
	<h3 id="account-title">Your connections</h3>
	<p>
		Keys are encrypted on the server and used only for your account. Saved keys are never sent back
		to the browser.
	</p>
	{#if loading}<p role="status">Loading connections…</p>
	{:else}
		{#if !encryptionConfigured}<p class="notice">
				API key storage is awaiting the server encryption key. See the setup instructions in README.
			</p>{/if}
		{#each PROVIDERS as provider}
			{@const saved = keys.find((key) => key.provider === provider)}
			<form
				onsubmit={(event) => {
					event.preventDefault();
					void update(provider);
				}}
			>
				<label for={`key-${provider}`}
					>{names[provider]} <span>{saved ? `Saved ${saved.hint}` : 'Not connected'}</span></label
				>
				<p>{descriptions[provider]}</p>
				<div class="key-row">
					<input
						id={`key-${provider}`}
						type="password"
						autocomplete="new-password"
						spellcheck="false"
						minlength="8"
						maxlength="512"
						required
						bind:value={drafts[provider]}
						placeholder={saved ? 'Enter a replacement key' : 'Paste your API key'}
						disabled={!encryptionConfigured || busy !== null}
					/>
					<button
						type="submit"
						disabled={!encryptionConfigured || busy !== null || drafts[provider].trim().length < 8}
						>{busy === provider ? 'Saving…' : 'Save'}</button
					>
					{#if saved}<button
							type="button"
							class="remove"
							disabled={busy !== null}
							onclick={() => update(provider, true)}>Remove</button
						>{/if}
				</div>
			</form>
		{/each}
	{/if}
	{#if message}<p class:failure={failed} role={failed ? 'alert' : 'status'}>{message}</p>{/if}
	<div class="sync" aria-live="polite">
		{#if $preferenceSync === 'error'}Settings could not be saved. <button
				onclick={() => flushPreferences()}>Retry saving</button
			>
		{:else if $preferenceSync === 'saving'}Saving your dashboard settings…
		{:else}Dashboard settings saved to your account.{/if}
	</div>
</section>

<style>
	section {
		display: grid;
		gap: 0.75rem;
		border-bottom: 1px solid var(--border);
		padding-bottom: 1.25rem;
	}
	h3 {
		font-size: 0.85rem;
		color: var(--text-primary);
		margin: 0;
	}
	p {
		font-size: 0.7rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin: 0;
	}
	form {
		display: grid;
		gap: 0.45rem;
		padding-top: 0.5rem;
	}
	label {
		font-size: 0.75rem;
		color: var(--text-primary);
	}
	label span {
		float: right;
		color: var(--text-secondary);
		font-size: 0.65rem;
	}
	.key-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	input {
		flex: 1;
		min-width: 140px;
		width: 100%;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 0.65rem;
		color: var(--text-primary);
		font-family: inherit;
		font-size: 0.7rem;
	}
	button {
		background: var(--accent);
		border: 1px solid var(--accent);
		color: #05180d;
		border-radius: 4px;
		padding: 0.5rem 0.7rem;
		font: inherit;
		font-size: 0.7rem;
		cursor: pointer;
	}
	.remove {
		color: var(--text-secondary);
		border-color: var(--border);
		background: transparent;
	}
	button:disabled {
		opacity: 0.5;
		cursor: default;
	}
	.failure,
	.notice {
		color: #efc68b;
	}
	.sync {
		color: var(--text-secondary);
		font-size: 0.65rem;
	}
</style>
