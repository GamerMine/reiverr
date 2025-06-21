<script lang="ts">
	import type { Genre } from '$lib/discover';
	import { capitalize } from '$lib/utils';

	let { genre }: { genre: Genre } = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<a
	class="rounded-xl overflow-hidden relative shadow-2xl shrink-0 aspect-[21/9] selectable h-40 block max-w-[100%]"
	href={`/discover/genre/${genre.name}`}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="h-full w-full flex flex-col items-center justify-center cursor-pointer p-2 px-3 relative z-[1] peer hover:text-white sm:hover:text-current"
	>
		<h1 class="font-bold text-2xl tracking-wider">
			{capitalize(genre.name)}
		</h1>
	</div>
	<div
		style={"background-image: url('/genres/" + genre.name + ".jpg')"}
		class="absolute inset-0 bg-center bg-cover sm:peer-hover:scale-105 transition-transform"
	></div>
	<div class="absolute inset-0 bg-darken/60"></div>
</a>
