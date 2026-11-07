<script lang="ts">
	import type { TitleType } from '#lib/utils/types.js';
	import { TMDB_PROFILE_SMALL } from '#lib/utils/constants.js';
	import { openTitleModal } from '#lib/stores/modal.store.js';
	import classNames from 'classnames';

	let {
		tmdbId,
		type = 'person',
		backdropUri,
		name,
		subtitle,
		size = 'md',

		openInModal = true
	}: {
		tmdbId: number;
		type?: TitleType;
		backdropUri: string;
		name: string;
		subtitle: string;
		size?: 'dynamic' | 'md' | 'lg';

		openInModal?: boolean;
	} = $props();
</script>

<button
	class={classNames(
		'selectable group relative flex shrink-0 flex-col justify-start gap-3 overflow-hidden rounded-xl bg-stone-900 p-4 text-left shadow-lg hover:bg-stone-800 hover:text-inherit focus-visible:bg-stone-800',
		{
			'h-56 w-36': size === 'md',
			'h-52': size === 'lg',
			'w-full': size === 'dynamic'
		}
	)}
	onclick={() => {
		if (openInModal) {
			openTitleModal(tmdbId, type);
		} else {
			window.location.href = `/${type}/${tmdbId}`;
		}
	}}
>
	<div class="mx-auto aspect-square w-full shrink-0 overflow-hidden rounded-full bg-zinc-200/20">
		<div
			style={"background-image: url('" + TMDB_PROFILE_SMALL + backdropUri + "')"}
			class="h-full w-full bg-cover bg-center transition-transform
			group-hover:scale-105 group-focus-visible:scale-105"
		></div>
	</div>
	<div>
		<h2 class="line-clamp-1 text-sm font-medium text-zinc-300">{subtitle}</h2>
		<h1 class="line-clamp-2 font-semibold">
			{name}
		</h1>
	</div>
</button>
