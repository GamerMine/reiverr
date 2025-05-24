<script lang="ts">
	import CardPlaceholder from '../Card/CardPlaceholder.svelte';

	let {
		size = 'md',
		orientation = 'landscape'
	}: { size?: 'dynamic' | 'md' | 'lg'; orientation?: 'landscape' | 'portrait' } = $props();
</script>

{#each Array(10) as _, i (i)}
	<CardPlaceholder {size} index={i} {orientation} />
{/each}
