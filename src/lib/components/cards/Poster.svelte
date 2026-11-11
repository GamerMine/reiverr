<script lang="ts">
	import type { TitleType } from '#lib/utils/types.js';
	import classNames from 'classnames';
	import PlayButton from '#lib/components/controls/PlayButton.svelte';
	import ProgressBar from '../layout/ProgressBar.svelte';
	import { playerState } from '#lib/components/player/VideoPlayer.js';
	import LazyImg from '#lib/components/images/LazyImg.svelte';
	import { Star } from 'svelte-radix';
	import { openTitleModal } from '#lib/stores/modal.store.js';
	import type { Snippet } from 'svelte';

	let {
		tmdbId,
		openInModal = true,
		jellyfinId = '',
		type = 'movie',
		backdropUrl,

		title = '',
		subtitle = '',
		rating = undefined,
		progress = 0,

		shadow = false,
		size = 'md',
		orientation = 'landscape',

		top_left = undefined,
		top_right = undefined,
		bottom_left = undefined,
		bottom_right = undefined
	}: {
		tmdbId: number | undefined;
		openInModal?: boolean;
		jellyfinId?: string;
		type?: TitleType;
		backdropUrl: string;

		title?: string;
		subtitle?: string;
		rating?: number;
		progress?: number;

		shadow?: boolean;
		size?: 'dynamic' | 'md' | 'lg' | 'sm';
		orientation?: 'portrait' | 'landscape';

		top_left?: Snippet;
		top_right?: Snippet;
		bottom_left?: Snippet;
		bottom_right?: Snippet;
	} = $props();

	function click() {
		if (openInModal && tmdbId) {
			openTitleModal(tmdbId, type);
		} else {
			window.location.href = tmdbId ? `/${type}/${tmdbId}` : '#';
		}
	}
</script>

<button
	onclick={click}
	class={classNames(
		'selectable group relative flex shrink-0 cursor-pointer overflow-hidden rounded-xl text-left hover:text-inherit',
		{
			'aspect-video': orientation === 'landscape',
			'aspect-2/3': orientation === 'portrait',
			'w-32': size === 'sm' && orientation === 'portrait',
			'h-32': size === 'sm' && orientation === 'landscape',
			'w-44': size === 'md' && orientation === 'portrait',
			'h-44': size === 'md' && orientation === 'landscape',
			'w-60': size === 'lg' && orientation === 'portrait',
			'h-60': size === 'lg' && orientation === 'landscape',
			'w-full': size === 'dynamic',
			'shadow-lg': shadow
		}
	)}
>
	<LazyImg
		src={backdropUrl}
		klass="absolute inset-0 group-hover:scale-105 transition-transform"
	/>
	<div
		class={classNames(
			'z-1 flex flex-1 flex-col justify-between bg-black/40 opacity-0 transition-opacity group-hover:opacity-100',
			{
				'px-3 py-2': true
			}
		)}
	>
		<div class="flex justify-between justify-self-start">
			{@render top_left?.()}
			{#if !top_left}
				<div>
					<h1 class="line-clamp-2 text-lg font-bold text-zinc-100">{title}</h1>
					<h2 class="line-clamp-2 text-sm font-medium text-zinc-300">{subtitle}</h2>
				</div>
			{/if}

			{@render top_right?.()}
			{#if !top_right}
				<div></div>
			{/if}
		</div>
		<div class="flex justify-between justify-self-end">
			{@render bottom_left?.()}
			{#if !bottom_left}
				<div>
					{#if rating}
						<h2 class="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
							<Star />{rating.toFixed(1)}
						</h2>
					{/if}
				</div>
			{/if}

			{@render bottom_right?.()}
			{#if !bottom_right}
				<div></div>
			{/if}
		</div>
	</div>
	{#if jellyfinId}
		<div class="absolute inset-0 z-1 flex items-center justify-center">
			<PlayButton
				onclick={(e) => {
					e.preventDefault();
					if (jellyfinId) playerState.streamJellyfinId(jellyfinId);
				}}
				klass="sm:opacity-0 group-hover:opacity-100 transition-opacity"
			/>
		</div>
	{/if}
	{#if progress}
		<div
			class="absolute inset-x-2 bottom-2 z-1 bg-linear-to-t ease-in-out lg:inset-x-3 lg:bottom-3"
		>
			<p>{progress.toFixed(1)}%</p>
			<ProgressBar {progress} />
		</div>
	{/if}
</button>
