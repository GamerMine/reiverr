<script lang="ts">
	import type { TitleType } from '$lib/types';
	import { TMDB_PROFILE_SMALL } from '$lib/constants';
	import { openTitleModal } from '$lib/stores/modal.store';
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
		'flex flex-col justify-start gap-3 p-4 rounded-xl overflow-hidden relative shadow-lg shrink-0 selectable hover:text-inherit hover:bg-stone-800 focus-visible:bg-stone-800 bg-stone-900 group text-left',
		{
			'w-36 h-56': size === 'md',
			'h-52': size === 'lg',
			'w-full': size === 'dynamic'
		}
	)}
	onclick={() => {
		if (openInModal) {
			openTitleModal({ type, id: tmdbId, provider: 'tmdb' });
		} else {
			window.location.href = `/${type}/${tmdbId}`;
		}
	}}
>
	<div class="mx-auto rounded-full overflow-hidden shrink-0 aspect-square w-full bg-zinc-200/20">
		<div
			style={"background-image: url('" + TMDB_PROFILE_SMALL + backdropUri + "')"}
			class="bg-center bg-cover group-hover:scale-105 group-focus-visible:scale-105 transition-transform
			w-full h-full"
		></div>
	</div>
	<div>
		<h2 class="text-sm text-zinc-300 font-medium line-clamp-1">{subtitle}</h2>
		<h1 class="font-semibold line-clamp-2">
			{name}
		</h1>
	</div>
</button>
