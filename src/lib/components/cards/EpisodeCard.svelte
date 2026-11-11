<script lang="ts">
	import classNames from 'classnames';
	import { Check } from 'svelte-radix';
	import { fade } from 'svelte/transition';
	import ContextMenu from '#lib/components/controls/ContextMenu.svelte';
	import ContextMenuItem from '#lib/components/controls/ContextMenuItem.svelte';
	import PlayButton from '#lib/components/controls/PlayButton.svelte';
	import ProgressBar from '../layout/ProgressBar.svelte';
	import { playerState } from '#lib/components/player/VideoPlayer.js';
	import type { Snippet } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { settings } from '#lib/stores/settings.svelte.js';
	import { PLACEHOLDER_BACKDROP } from '#lib/utils/constants.js';
	import { jellyfinSetItemWatched } from '#lib/remote/jellyfin.remote.js';

	let {
		backdropUrl,

		title = '',
		subtitle = '',
		episodeNumber = undefined,
		runtime = 0,
		progress = 0,
		watched = false,
		airDate = undefined,

		jellyfinId = undefined,

		size = 'md',

		onclick,
		left_top = undefined,
		right_top = undefined,
		left_bottom = undefined,
		right_bottom = undefined
	}: {
		backdropUrl: string;

		title?: string;
		subtitle?: string;
		episodeNumber?: string;
		runtime?: number;
		progress?: number;
		watched?: boolean;
		airDate?: Date;

		jellyfinId?: string;

		size?: 'md' | 'sm' | 'dynamic';

		onclick: (e: MouseEvent) => void;
		left_top?: Snippet;
		right_top?: Snippet;
		left_bottom?: Snippet;
		right_bottom?: Snippet;
	} = $props();

	function handleSetWatched() {
		if (!jellyfinId) return;

		watched = true;
		progress = 0;
		jellyfinSetItemWatched({ id: jellyfinId, watched: true });
	}

	function handleSetUnwatched() {
		if (!jellyfinId) return;

		watched = false;
		jellyfinSetItemWatched({ id: jellyfinId, watched: false });
	}

	function handlePlay(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (!jellyfinId) return;

		playerState.streamJellyfinId(jellyfinId);
	}
</script>

<ContextMenu heading={subtitle}>
	{#snippet menu()}
		<ContextMenuItem
			onclick={handleSetWatched}
			disabled={!handleSetWatched || watched || !jellyfinId}
		>
			{$_('library.LibraryItemContext.markWatched')}
		</ContextMenuItem>
		<ContextMenuItem
			onclick={handleSetUnwatched}
			disabled={!handleSetUnwatched || !watched || !jellyfinId}
		>
			{$_('library.LibraryItemContext.markUnwatched')}
		</ContextMenuItem>
	{/snippet}
	<a
		{onclick}
		class={classNames(
			'selectable placeholder-image relative block aspect-video shrink-0 overflow-hidden rounded-lg shadow-lg transition-opacity',
			'flex cursor-pointer flex-col gap-2 px-2 py-2 text-left lg:px-3',
			{
				'h-44': size === 'md',
				'h-36 lg:h-44': size === 'sm',
				'h-full': size === 'dynamic',
				group: !!jellyfinId,
				'cursor-default!': !jellyfinId
			}
		)}
		in:fade|global={{ duration: 100, delay: 100 }}
		out:fade|global={{ duration: 100 }}
	>
		<div
			class={classNames('absolute inset-0 bg-cover bg-center transition-transform', {
				'group-hover:scale-105 group-focus-visible:scale-105': !!jellyfinId,
				grayscale: !jellyfinId
			})}
			style={"background-image: url('" + (backdropUrl || PLACEHOLDER_BACKDROP) + "');"}
		></div>
		{#if !jellyfinId}
			<div class="absolute inset-0 bg-black/60"></div>
		{/if}
		<div
			class={classNames(
				'relative flex flex-1 flex-col justify-between transition-all',
				'text-xs font-medium text-zinc-300 lg:text-sm',
				{
					'group-hover:opacity-0 group-focus-visible:opacity-0': !!jellyfinId
				}
			)}
		>
			<div class="flex items-center justify-between">
				<div>
					{@render left_top?.()}
					{#if !left_top}
						{#if airDate && airDate > new Date()}
							<p>
								{airDate.toLocaleString(settings.userSettings.interface.language, {
									month: 'short',
									day: 'numeric',
									hour: 'numeric',
									minute: 'numeric'
								})}
							</p>
						{:else if episodeNumber}
							<p>{episodeNumber}</p>
						{/if}
					{/if}
				</div>
				<div>
					{@render right_top?.()}
					{#if !right_top}
						{#if watched}
							<div
								class="flex items-center rounded-md bg-black/40 px-2 font-bold backdrop-blur-md"
							>
								<Check size="25" />
								<p>{$_('library.watched')}</p>
							</div>
						{/if}
						{#if runtime && !progress}
							<p>
								{runtime.toFixed(0)} min
							</p>
						{:else if runtime && progress}
							<p>
								{(runtime - (runtime / 100) * progress).toFixed(0)} min left
							</p>
						{/if}
					{/if}
				</div>
			</div>
			<div class="flex items-end justify-between">
				{@render left_bottom?.()}
				{#if !left_bottom}
					<div class="flex flex-col items-start">
						{#if subtitle}
							<h2 class="text-sm font-medium text-zinc-300">{subtitle}</h2>
						{/if}
						{#if title}
							<h1 class="line-clamp-2 text-left text-base font-medium text-zinc-200">
								{title}
							</h1>
						{/if}
					</div>
				{/if}
				{@render right_bottom?.()}
			</div>
		</div>
		{#if progress}
			<div class="relative transition-opacity group-hover:opacity-0">
				<ProgressBar {progress} />
			</div>
		{/if}
		<div class="absolute inset-0 flex items-center justify-center">
			{#if jellyfinId}
				<PlayButton
					onclick={handlePlay}
					klass="sm:opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
				/>
			{/if}
		</div>
	</a>
</ContextMenu>
