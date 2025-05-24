<script lang="ts">
	import ContextMenu from './ContextMenu.svelte';
	import type { Snippet } from 'svelte';

	let {
		heading = '',

		children,
		menu
	}: { heading?: string; children: Snippet; menu: Snippet } = $props();
</script>

<div class="relative">
	<ContextMenu position="absolute" {heading} {menu}>
		{@render children?.()}
	</ContextMenu>
</div>
