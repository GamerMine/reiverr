<script lang="ts">
	import type { TitleType } from '#lib/utils/types.js';
	import { formatMinutesToTime } from '#lib/utils/utils.js';
	import classNames from 'classnames';
	import { Clock, Star } from 'svelte-radix';
	import { openTitleModal } from '#lib/stores/modal.store.js';
	import ContextMenu from '#lib/components/controls/ContextMenu.svelte';
	import LibraryItemContextItems from '#lib/components/controls/LibraryItemContextItems.svelte';
	import ProgressBar from '../layout/ProgressBar.svelte';
	import LazyImg from '#lib/components/images/LazyImg.svelte';
	import { onMount } from 'svelte';
	import { jellyfinGetItems } from '#lib/remote/jellyfin.remote.js';
	import type { JellyfinBaseItemDto } from '@unifarr/connectors/types/jellyfin';

	let {
		tmdbId,
		type = 'movie',
		title,
		genres = [],
		runtimeMinutes = 0,
		seasons = 0,
		completionTime = '',
		backdropUrl,
		rating,

		available = true,
		progress = 0,
		size = 'md',
		openInModal = true
	}: {
		tmdbId: number;
		type?: TitleType;
		title: string;
		genres?: string[];
		runtimeMinutes?: number;
		seasons?: number;
		completionTime?: string;
		backdropUrl: string;
		rating: number;

		available?: boolean;
		progress?: number;
		size?: 'dynamic' | 'md' | 'lg';
		openInModal?: boolean;
	} = $props();

	let jellyfinItem: JellyfinBaseItemDto | undefined = $state();
	onMount(async () => {
		await jellyfinGetItems();
		jellyfinItem = jellyfinGetItems().current?.data?.find(
			(i) => i.ProviderIds?.Tmdb === tmdbId.toString()
		);
	});
</script>

<ContextMenu heading={title}>
	{#snippet menu()}
		<LibraryItemContextItems {jellyfinItem} {type} {tmdbId} />
	{/snippet}
	<button
		class={classNames(
			'selectable group placeholder-image relative flex aspect-video shrink-0 flex-col justify-between overflow-hidden rounded-xl shadow-lg hover:text-inherit',
			'gap-2 p-2 px-3',
			{
				'h-40': size === 'md',
				'h-60': size === 'lg',
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
		<LazyImg
			src={backdropUrl}
			klass="absolute inset-0 transition-transform group-hover:scale-105 group-focus-visible:scale-105"
		/>
		<div
			class={classNames('absolute inset-0 bg-black/60 transition-opacity', {
				'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100': available
			})}
		></div>
		<div
			class="relative flex flex-1 cursor-pointer flex-col justify-between opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
		>
			<div class="text-left">
				<h1 class="text-lg font-bold tracking-wider">{title}</h1>
				<div class="text-xs font-medium tracking-wider text-zinc-300">
					{genres
						.map((genre) => genre.charAt(0).toUpperCase() + genre.slice(1))
						.join(', ')}
				</div>
			</div>
			<div class="flex items-end justify-between">
				{#if completionTime}
					<div class="text-sm font-medium tracking-wide text-zinc-200">
						Downloaded in <b
							>{formatMinutesToTime(
								(new Date(completionTime).getTime() - Date.now()) / 1000 / 60
							)}</b
						>
					</div>
				{:else}
					{#if runtimeMinutes}
						<div class="flex items-center gap-1.5">
							<Clock />
							<div class="text-sm text-zinc-200">
								{progress
									? formatMinutesToTime(
											runtimeMinutes - runtimeMinutes * (progress / 100)
										) + ' left'
									: formatMinutesToTime(runtimeMinutes)}
							</div>
						</div>
					{/if}
					{#if seasons}
						<div class="text-sm text-zinc-200">
							{seasons} Season{seasons > 1 ? 's' : ''}
						</div>
					{/if}

					{#if rating}
						<div class="flex items-center gap-1.5">
							<Star />
							<div class="text-sm text-zinc-200">
								{rating.toFixed(1)}
							</div>
						</div>
					{/if}
				{/if}
			</div>
		</div>
		{#if progress}
			<div class="relative">
				<ProgressBar {progress} />
			</div>
		{/if}
	</button>
</ContextMenu>
