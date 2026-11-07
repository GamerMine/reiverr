<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<!-- TODO: Add horizontal carousel fade effect -->
<div class="scrollbar-hide max-h-[70vh] overflow-y-scroll">
	{@render children?.()}
</div>
