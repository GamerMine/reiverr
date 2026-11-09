<script lang="ts">
	import type { Genre } from '#lib/utils/discover.js';
	import { capitalize } from '#lib/utils/utils.js';

	let { genre }: { genre: Genre } = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<a
	class="selectable relative block aspect-[21/9] h-40 max-w-[100%] shrink-0 overflow-hidden rounded-xl shadow-2xl"
	href={`/discover/genre/${genre.name}`}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="peer relative z-[1] flex h-full w-full cursor-pointer flex-col items-center justify-center p-2 px-3 hover:text-white sm:hover:text-current"
	>
		<h1 class="text-2xl font-bold tracking-wider">
			{capitalize(genre.name)}
		</h1>
	</div>
	<div
		style={"background-image: url('/genres/" + genre.name + ".jpg')"}
		class="absolute inset-0 bg-cover bg-center transition-transform sm:peer-hover:scale-105"
	></div>
	<div class="bg-darken/60 absolute inset-0"></div>
</a>
