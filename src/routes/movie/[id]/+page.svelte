<script lang="ts">
	import type { PageData } from './$types';
	import MoviePage from './MoviePage.svelte';

	let { data }: { data: PageData } = $props();

	let tmdbId: number = $state(0);
	$effect(() => {
		tmdbId = Number(data.tmdbId);
	});
</script>

{#key tmdbId}
	<MoviePage {tmdbId} />
{/key}
