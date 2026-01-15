<script lang="ts">
	import Modal from './Modal.svelte';
	import type { WorldLeader } from '$lib/types';

	interface Props {
		leader: WorldLeader | null;
		open: boolean;
		onClose: () => void;
	}

	let { leader, open, onClose }: Props = $props();

	const currentYear = new Date().getFullYear();
	const age = $derived(leader?.bio?.birthYear ? currentYear - leader.bio.birthYear : null);
</script>

{#if leader}
	<Modal {open} title={leader.name} {onClose}>
		<div class="leader-detail">
			<div class="leader-header">
				<span class="leader-flag">{leader.flag}</span>
				<div class="leader-header-info">
					<h3 class="leader-name">{leader.name}</h3>
					<div class="leader-position">{leader.title} of {leader.country}</div>
					<div class="leader-party">{leader.party}</div>
				</div>
			</div>

			<div class="leader-meta-row">
				<div class="meta-item">
					<span class="meta-label">In Office</span>
					<span class="meta-value">Since {leader.since}</span>
				</div>
				{#if age}
					<div class="meta-item">
						<span class="meta-label">Age</span>
						<span class="meta-value">{age}</span>
					</div>
				{/if}
			</div>

			{#if leader.bio}
				<div class="section">
					<h4 class="section-title">Background</h4>
					<p class="bio-text">{leader.bio.background}</p>
				</div>

				{#if leader.bio.birthPlace}
					<div class="section">
						<h4 class="section-title">Birthplace</h4>
						<p class="bio-text">{leader.bio.birthPlace}</p>
					</div>
				{/if}

				{#if leader.bio.education}
					<div class="section">
						<h4 class="section-title">Education</h4>
						<p class="bio-text">{leader.bio.education}</p>
					</div>
				{/if}

				{#if leader.bio.previousRoles && leader.bio.previousRoles.length > 0}
					<div class="section">
						<h4 class="section-title">Previous Roles</h4>
						<ul class="roles-list">
							{#each leader.bio.previousRoles as role}
								<li>{role}</li>
							{/each}
						</ul>
					</div>
				{/if}
			{/if}

			{#if leader.focus && leader.focus.length > 0}
				<div class="section">
					<h4 class="section-title">Current Focus Areas</h4>
					<div class="focus-tags">
						{#each leader.focus as topic}
							<span class="focus-tag">{topic}</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if leader.news && leader.news.length > 0}
				<div class="section">
					<h4 class="section-title">Recent News</h4>
					<div class="news-list">
						{#each leader.news.slice(0, 5) as news}
							<a href={news.link} target="_blank" rel="noopener noreferrer" class="news-item">
								<span class="news-title">{news.title}</span>
								<span class="news-source">{news.source}</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</Modal>
{/if}

<style>
	.leader-detail {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.leader-header {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border);
	}

	.leader-flag {
		font-size: 3rem;
		line-height: 1;
	}

	.leader-header-info {
		flex: 1;
	}

	.leader-name {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0;
		color: var(--text-primary);
	}

	.leader-position {
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}

	.leader-party {
		font-size: 0.7rem;
		color: var(--text-muted);
		margin-top: 0.25rem;
	}

	.leader-meta-row {
		display: flex;
		gap: 1.5rem;
		padding: 0.75rem;
		background: var(--surface-hover);
		border-radius: 6px;
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.meta-label {
		font-size: 0.6rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.meta-value {
		font-size: 0.8rem;
		color: var(--text-primary);
		font-weight: 500;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.section-title {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin: 0;
	}

	.bio-text {
		font-size: 0.8rem;
		color: var(--text-primary);
		line-height: 1.5;
		margin: 0;
	}

	.roles-list {
		margin: 0;
		padding-left: 1.25rem;
		font-size: 0.75rem;
		color: var(--text-primary);
		line-height: 1.6;
	}

	.roles-list li {
		margin-bottom: 0.25rem;
	}

	.focus-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.focus-tag {
		font-size: 0.7rem;
		background: rgba(68, 136, 255, 0.15);
		color: var(--info);
		padding: 0.3rem 0.6rem;
		border-radius: 4px;
	}

	.news-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.news-item {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.5rem;
		background: var(--surface-hover);
		border-radius: 4px;
		text-decoration: none;
		transition: background 0.2s;
	}

	.news-item:hover {
		background: var(--border);
	}

	.news-title {
		font-size: 0.75rem;
		color: var(--text-primary);
		line-height: 1.3;
	}

	.news-source {
		font-size: 0.6rem;
		color: var(--text-muted);
	}
</style>
