<script lang="ts">
	import type { TitleType } from '#lib/utils/types.js';
	import { fly } from 'svelte/transition';
	import MoviePage from '../pages/MoviePage.svelte';
	import SeriesPage from '../pages/SeriesPage.svelte';
	import { modalStack } from '#lib/stores/modal.store.js';
	import PersonPage from '../pages/PersonPage.svelte';

	let { tmdbId, titleType, modalId }: { tmdbId: number; titleType: TitleType; modalId: symbol } =
		$props();

	function handleCloseModal() {
		modalStack.close(modalId);
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
	class="scrollbar-hide flex h-screen w-screen justify-center overflow-x-hidden overflow-y-scroll"
	onclick={(e) => {
		if (e.target === e.currentTarget) handleCloseModal();
	}}
>
	<div class="h-fit max-w-screen-2xl sm:mx-4 lg:mx-12 xl:mx-16">
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
</div>
