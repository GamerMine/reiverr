<script lang="ts">
	import type { TitleType } from '$lib/types';
	import { fly } from 'svelte/transition';
	import MoviePage from '../../../routes/movie/[id]/MoviePage.svelte';
	import SeriesPage from '../../../routes/tv/[id]/SeriesPage.svelte';
	import { modalStack } from '$lib/stores/modal.store';
	import PersonPage from '../../../routes/person/[id]/PersonPage.svelte';

	let { tmdbId, titleType, modalId }: { tmdbId: number; titleType: TitleType; modalId: symbol } =
		$props();

	function handleCloseModal() {
		modalStack.close(modalId);
	}
</script>

<div
	class="max-w-screen-2xl overflow-x-hidden overflow-y-scroll h-screen sm:mx-4 lg:mx-12 xl:mx-16 scrollbar-hide"
>
	<div
		class="relative overflow-hidden"
		in:fly|global={{ y: 20, duration: 200, delay: 200 }}
		out:fly|global={{ y: 20, duration: 200 }}
	>
		{#if titleType === 'movie'}
			<MoviePage {tmdbId} isModal={true} {handleCloseModal} />
		{:else if titleType === 'tv'}
			<SeriesPage {tmdbId} isModal={true} {handleCloseModal} />
		{:else if titleType === 'person'}
			<PersonPage {tmdbId} isModal={true} {handleCloseModal} />
		{/if}
	</div>
</div>
