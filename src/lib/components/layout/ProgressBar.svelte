<script lang="ts">
	import { onMount } from 'svelte';

	let { progress = 0 }: { progress?: number } = $props();
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});
</script>

<div class="h-1 bg-zinc-200/20 rounded-full overflow-hidden">
	<div
		style={'max-width: ' + (mounted ? progress : 0) + '%'}
		class="h-full bg-zinc-200/80 transition-[max-width] delay-200 duration-500"
	></div>
</div>
