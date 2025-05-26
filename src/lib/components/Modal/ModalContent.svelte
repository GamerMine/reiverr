<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<!-- TODO: Add horizontal carousel fade effect -->
<div class="max-h-[70vh] scrollbar-hide overflow-y-scroll">
	{@render children?.()}
</div>
