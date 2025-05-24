<script lang="ts">
	import type { TitleType } from '$lib/types';
	import classNames from 'classnames';
	import PlayButton from '../PlayButton.svelte';
	import ProgressBar from '../ProgressBar.svelte';
	import { playerState } from '../VideoPlayer/VideoPlayer';
	import LazyImg from '../LazyImg.svelte';
	import { Star } from 'radix-icons-svelte';
	import { openTitleModal } from '$lib/stores/modal.store';
	import type { Snippet } from 'svelte';

	let {
		tmdbId = undefined,
		tvdbId = undefined,
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
		tmdbId?: number;
		tvdbId?: number;
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
</script>

<button
	onclick={() => {
		if (openInModal) {
			if (tmdbId) {
				openTitleModal({ type, id: tmdbId, provider: 'tmdb' });
			} else if (tvdbId) {
				openTitleModal({ type, id: tvdbId, provider: 'tvdb' });
			}
		} else {
			window.location.href = tmdbId || tvdbId ? `/${type}/${tmdbId || tvdbId}` : '#';
		}
	}}
	class={classNames(
		'relative flex rounded-xl selectable group hover:text-inherit shrink-0 overflow-hidden text-left',
		{
			'aspect-video': orientation === 'landscape',
			'aspect-[2/3]': orientation === 'portrait',
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
	<LazyImg src={backdropUrl} klass="absolute inset-0 group-hover:scale-105 transition-transform" />
	<div
		class="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity bg-black"
		style="filter: blur(50px); transform: scale(3);"
	>
		<LazyImg src={backdropUrl} />
	</div>
	<!-- <div
		style={`background-image: url(${backdropUrl}); background-size: cover; background-position: center; filter: blur(50px); transform: scale(3);`}
		class="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity bg-black"
	/> -->
	<div
		class={classNames(
			'flex-1 flex flex-col justify-between bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-[1]',
			{
				'py-2 px-3': true
			}
		)}
	>
		<div class="flex justify-self-start justify-between">
			{@render top_left?.()}
			{#if !top_left}
				<div>
					<h1 class="text-zinc-100 font-bold line-clamp-2 text-lg">{title}</h1>
					<h2 class="text-zinc-300 text-sm font-medium line-clamp-2">{subtitle}</h2>
				</div>
			{/if}

			{@render top_right?.()}
			{#if !top_right}
				<div></div>
			{/if}
		</div>
		<div class="flex justify-self-end justify-between">
			{@render bottom_left?.()}
			{#if !bottom_left}
				<div>
					{#if rating}
						<h2 class="flex items-center gap-1.5 text-sm text-zinc-300 font-medium">
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
	<!-- <div
		class="absolute inset-0 bg-gradient-to-t from-darken group-hover:opacity-0 transition-opacity z-[1]"
	/> -->
	{#if jellyfinId}
		<div class="absolute inset-0 flex items-center justify-center z-[1]">
			<PlayButton
				onclick={(e) => {
					e.preventDefault();
					jellyfinId && playerState.streamJellyfinId(jellyfinId);
				}}
				klass="sm:opacity-0 group-hover:opacity-100 transition-opacity"
			/>
		</div>
	{/if}
	{#if progress}
		<div
			class="absolute bottom-2 lg:bottom-3 inset-x-2 lg:inset-x-3 bg-gradient-to-t ease-in-out z-[1]"
		>
			<ProgressBar {progress} />
		</div>
	{/if}
</button>
