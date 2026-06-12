<script lang="ts">
	import type { PageData } from './$types';
	import SeriesPage from './SeriesPage.svelte';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	let tmdbId: number | undefined = $state();

	onMount(() => {
		tmdbId = data.tmdbId;
	});
</script>

{#key tmdbId}
	{#if tmdbId}
		<SeriesPage {tmdbId} />
	{/if}
{/key}
