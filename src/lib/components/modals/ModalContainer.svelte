<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div
	class="mx-4 mt-[10vh] flex max-w-3xl flex-1 flex-col self-start rounded-sm bg-[#33333388] drop-shadow-xl backdrop-blur-xl sm:mx-16 lg:mx-24"
	in:fly|global={{ y: 20, duration: 200, delay: 200 }}
	out:fly|global={{ y: 20, duration: 200 }}
>
	{@render children?.()}
</div>
