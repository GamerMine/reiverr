<script lang="ts">
	import type { TitleId } from '$lib/types';
	import type { PageData } from './$types';
	import SeriesPage from './SeriesPage.svelte';

	let { data }: { data: PageData } = $props();

	let titleId: TitleId | undefined = $state();
	$effect(() => {
		titleId = { provider: 'tmdb', id: data.tmdbId, type: 'series' };
	});
</script>

{#key titleId}
	{#if titleId}
		<SeriesPage {titleId} />
	{/if}
{/key}
