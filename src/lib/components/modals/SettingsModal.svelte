<script lang="ts">
	import Modal from './Modal.svelte';
	import { settings } from '$lib/stores';
	import { PANELS, NON_DRAGGABLE_PANELS, type PanelId } from '$lib/config';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open = false, onClose }: Props = $props();

	// Drag state
	let draggedPanel = $state<PanelId | null>(null);
	let dragOverPanel = $state<PanelId | null>(null);

	function handleTogglePanel(panelId: PanelId) {
		settings.togglePanel(panelId);
	}

	function handleResetPanels() {
		settings.reset();
	}

	// Get ordered panels (only enabled ones)
	function getOrderedPanels(): PanelId[] {
		return $settings.order.filter(id => $settings.enabled[id] && !NON_DRAGGABLE_PANELS.includes(id));
	}

	// Drag and drop handlers
	function handleDragStart(e: DragEvent, panelId: PanelId) {
		if (NON_DRAGGABLE_PANELS.includes(panelId)) {
			e.preventDefault();
			return;
		}
		draggedPanel = panelId;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', panelId);
		}
	}

	function handleDragOver(e: DragEvent, panelId: PanelId) {
		e.preventDefault();
		if (draggedPanel && draggedPanel !== panelId && !NON_DRAGGABLE_PANELS.includes(panelId)) {
			dragOverPanel = panelId;
		}
	}

	function handleDragLeave() {
		dragOverPanel = null;
	}

	function handleDrop(e: DragEvent, targetPanelId: PanelId) {
		e.preventDefault();
		if (draggedPanel && draggedPanel !== targetPanelId) {
			const currentOrder = [...$settings.order];
			const fromIndex = currentOrder.indexOf(draggedPanel);
			const toIndex = currentOrder.indexOf(targetPanelId);
			
			if (fromIndex !== -1 && toIndex !== -1) {
				currentOrder.splice(fromIndex, 1);
				currentOrder.splice(toIndex, 0, draggedPanel);
				settings.updateOrder(currentOrder);
			}
		}
		draggedPanel = null;
		dragOverPanel = null;
	}

	function handleDragEnd() {
		draggedPanel = null;
		dragOverPanel = null;
	}

	function movePanelUp(panelId: PanelId) {
		const visiblePanels = getOrderedPanels();
		const visibleIndex = visiblePanels.indexOf(panelId);
		if (visibleIndex > 0) {
			const panelAbove = visiblePanels[visibleIndex - 1];
			// Swap in the full order array
			const currentOrder = [...$settings.order];
			const fromIndex = currentOrder.indexOf(panelId);
			const toIndex = currentOrder.indexOf(panelAbove);
			currentOrder.splice(fromIndex, 1);
			currentOrder.splice(toIndex, 0, panelId);
			settings.updateOrder(currentOrder);
		}
	}

	function movePanelDown(panelId: PanelId) {
		const visiblePanels = getOrderedPanels();
		const visibleIndex = visiblePanels.indexOf(panelId);
		if (visibleIndex < visiblePanels.length - 1) {
			const panelBelow = visiblePanels[visibleIndex + 1];
			// Swap in the full order array
			const currentOrder = [...$settings.order];
			const fromIndex = currentOrder.indexOf(panelId);
			const toIndex = currentOrder.indexOf(panelBelow);
			// Remove from current position and insert after the panel below
			currentOrder.splice(fromIndex, 1);
			// If moving down, we need to insert after the target
			const newToIndex = currentOrder.indexOf(panelBelow);
			currentOrder.splice(newToIndex + 1, 0, panelId);
			settings.updateOrder(currentOrder);
		}
	}
</script>

<Modal {open} title="Settings" {onClose}>
	<div class="settings-sections">
		<section class="settings-section">
			<h3 class="section-title">Enabled Panels</h3>
			<p class="section-desc">Toggle panels on/off to customize your dashboard</p>

			<div class="panels-grid">
				{#each Object.entries(PANELS) as [id, config]}
					{@const panelId = id as PanelId}
					{@const isEnabled = $settings.enabled[panelId]}
					<label class="panel-toggle" class:enabled={isEnabled}>
						<input
							type="checkbox"
							checked={isEnabled}
							onchange={() => handleTogglePanel(panelId)}
						/>
						<span class="panel-name">{config.name}</span>
					</label>
				{/each}
			</div>
		</section>

		<section class="settings-section">
			<h3 class="section-title">Panel Order</h3>
			<p class="section-desc">Drag panels or use arrows to rearrange</p>

			<div class="panel-order-list">
				{#each getOrderedPanels() as panelId, index}
					{@const config = PANELS[panelId]}
					<div
						class="order-item"
						class:dragging={draggedPanel === panelId}
						class:drag-over={dragOverPanel === panelId}
						draggable="true"
						ondragstart={(e) => handleDragStart(e, panelId)}
						ondragover={(e) => handleDragOver(e, panelId)}
						ondragleave={handleDragLeave}
						ondrop={(e) => handleDrop(e, panelId)}
						ondragend={handleDragEnd}
						role="listitem"
					>
						<span class="drag-handle">⋮⋮</span>
						<span class="order-index">{index + 1}</span>
						<span class="order-name">{config.name}</span>
						<div class="order-buttons">
							<button 
								class="order-btn" 
								onclick={() => movePanelUp(panelId)}
								disabled={index === 0}
								title="Move up"
							>↑</button>
							<button 
								class="order-btn" 
								onclick={() => movePanelDown(panelId)}
								disabled={index === getOrderedPanels().length - 1}
								title="Move down"
							>↓</button>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<section class="settings-section">
			<h3 class="section-title">Dashboard</h3>
			<button class="reset-btn" onclick={handleResetPanels}> Reset All Settings </button>
		</section>

		<section class="settings-section about-section">
			<h3 class="section-title">About</h3>
			<div class="about-content">
				<div class="about-logo">SITUATION MONITOR</div>
				<p class="about-version">v2.0.0</p>
				<p class="about-desc">
					A comprehensive real-time geopolitical intelligence platform that aggregates, analyzes, and visualizes 
					global conflicts, developments, news, market data, and geopolitical events. Designed for analysts, 
					researchers, traders, and anyone who needs to stay informed about world events as they unfold.
				</p>
				<div class="about-features">
					<div class="feature-item">📰 Multi-source news aggregation</div>
					<div class="feature-item">📊 Live market & commodity data</div>
					<div class="feature-item">🗺️ Interactive global map with conflicts</div>
					<div class="feature-item">⚔️ Real-time conflict tracking</div>
					<div class="feature-item">🎯 Sentiment & narrative analysis</div>
					<div class="feature-item">🔔 Custom keyword monitors</div>
					<div class="feature-item">🌐 World leader tracking</div>
					<div class="feature-item">📈 Pattern correlation analysis</div>
					<div class="feature-item">🏦 Federal Reserve monitoring</div>
				</div>
				<div class="about-sources">
					<p class="sources-title">Data Sources</p>
					<p class="sources-list">
						GDELT Project, Reuters, AP, Foreign Affairs, CSIS, Brookings, CFR, 
						War on the Rocks, Bellingcat, ISW, Financial markets, Federal Reserve, 
						and multiple verified intelligence sources.
					</p>
				</div>
				<p class="about-disclaimer">
					⚠️ This tool is for informational purposes only. Always verify information 
					through official sources before making decisions.
				</p>
				<p class="about-ai-note">
					🤖 Built with the assistance of AI • Enhanced with real-time conflict monitoring
				</p>
				<div class="about-links">
					<a href="https://github.com/nikankad/situation-monitor" target="_blank" rel="noopener noreferrer" class="link-text">
						source code
					</a>
					<span class="link-divider">•</span>
					<span>By: <a href="https://github.com/nikankad" target="_blank" rel="noopener noreferrer" class="link-text">Nikan</a></span>
				</div>
			</div>
		</section>
	</div>
</Modal>

<style>
	.settings-sections {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.settings-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.section-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		margin: 0;
	}

	.section-desc {
		font-size: 0.65rem;
		color: var(--text-muted);
		margin: 0;
	}

	.panels-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.panel-toggle {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.6rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.panel-toggle:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.panel-toggle.enabled {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.1);
	}

	.panel-toggle input {
		accent-color: var(--accent);
	}

	.panel-name {
		flex: 1;
		font-size: 0.65rem;
		color: var(--text-primary);
	}

	.reset-btn {
		padding: 0.5rem 1rem;
		background: rgba(255, 68, 68, 0.1);
		border: 1px solid rgba(255, 68, 68, 0.3);
		border-radius: 4px;
		color: var(--danger);
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.reset-btn:hover {
		background: rgba(255, 68, 68, 0.2);
	}

	.panel-order-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-height: 200px;
		overflow-y: auto;
	}

	.order-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.5rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 4px;
		cursor: grab;
		transition: all 0.15s ease;
	}

	.order-item:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: var(--accent);
	}

	.order-item.dragging {
		opacity: 0.5;
		border-color: var(--accent);
	}

	.order-item.drag-over {
		border-color: var(--accent);
		background: rgba(0, 255, 136, 0.1);
		transform: scale(1.02);
	}

	.drag-handle {
		color: var(--text-muted);
		font-size: 0.7rem;
		cursor: grab;
		user-select: none;
	}

	.order-index {
		font-size: 0.55rem;
		color: var(--text-muted);
		background: rgba(255, 255, 255, 0.1);
		padding: 0.1rem 0.3rem;
		border-radius: 2px;
		min-width: 1.2rem;
		text-align: center;
	}

	.order-name {
		flex: 1;
		font-size: 0.65rem;
		color: var(--text-primary);
	}

	.order-buttons {
		display: flex;
		gap: 0.2rem;
	}

	.order-btn {
		width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--border);
		border-radius: 3px;
		color: var(--text-secondary);
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.order-btn:hover:not(:disabled) {
		background: rgba(0, 255, 136, 0.2);
		border-color: var(--accent);
		color: var(--accent);
	}

	.order-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.about-section {
		border-top: 1px solid var(--border);
		padding-top: 1rem;
	}

	.about-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.about-logo {
		font-size: 1rem;
		font-weight: 700;
		color: var(--accent);
		letter-spacing: 0.15em;
		text-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
	}

	.about-version {
		font-size: 0.6rem;
		color: var(--text-muted);
		margin: -0.5rem 0 0;
	}

	.about-desc {
		font-size: 0.65rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin: 0;
	}

	.about-features {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.4rem;
	}

	.feature-item {
		font-size: 0.6rem;
		color: var(--text-primary);
		padding: 0.3rem 0.5rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 4px;
	}

	.about-sources {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 0.5rem;
	}

	.sources-title {
		font-size: 0.6rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin: 0 0 0.25rem;
	}

	.sources-list {
		font-size: 0.55rem;
		color: var(--text-muted);
		line-height: 1.4;
		margin: 0;
	}

	.about-disclaimer {
		font-size: 0.55rem;
		color: var(--warning);
		background: rgba(255, 204, 0, 0.1);
		border: 1px solid rgba(255, 204, 0, 0.2);
		border-radius: 4px;
		padding: 0.4rem;
		margin: 0;
	}

	.about-ai-note {
		font-size: 0.55rem;
		color: var(--text-muted);
		text-align: center;
		margin: 0;
		opacity: 0.7;
	}

	.about-links {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border);
		font-size: 0.55rem;
	}

	.link-text {
		color: var(--text-muted);
		text-decoration: none;
		transition: color 0.2s ease;
		cursor: pointer;
	}

	.link-text:hover {
		color: var(--accent);
	}

	.link-divider {
		color: var(--border);
	}
</style>
