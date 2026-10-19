<script lang="ts">
 import MarketsConfigModal from './MarketsConfigModal.svelte';
 let { open = false, onClose }: { open: boolean; onClose: () => void } = $props();
</script>
<MarketsConfigModal {open} {onClose} />
