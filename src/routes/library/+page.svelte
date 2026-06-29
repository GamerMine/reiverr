<script lang="ts">
	import Button from '$lib/components/controls/Button.svelte';
	import Carousel from '$lib/components/carousel/Carousel.svelte';
	import Poster from '$lib/components/cards/Poster.svelte';
	import { playerState } from '$lib/components/player/VideoPlayer';
	import { PLACEHOLDER_BACKDROP } from '$lib/utils/constants';
	import { ChevronRight } from 'svelte-radix';
	import { _ } from 'svelte-i18n';
	import { fade } from 'svelte/transition';
	import LibraryItems from './LibraryItems.svelte';
	import LazyImg from '$lib/components/images/LazyImg.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { radarrGetQueue } from '$lib/remote/radarr.remote';
	import { sonarrGetQueue } from '$lib/remote/sonarr.remote';
	import { jellyfinGetItems } from '$lib/remote/jellyfin.remote';
	import type { RadarrMediaCover, RadarrQueueStatus } from '@reiverr/connectors/types/radarr';
	import type { SonarrMediaCover, SonarrQueueStatus } from '@reiverr/connectors/types/sonarr';
	import type { JellyfinBaseItemDto } from '@reiverr/connectors/types/jellyfin';
	import { getJellyfinBackdrop, getJellyfinPosterUrl } from '$lib/utils/utils.ts';

	let noItems = false;

	let showcasePromise: Promise<JellyfinBaseItemDto | undefined> = jellyfinGetItems().then(
		(items) =>
			items.data
				?.slice()
				?.sort((a, b) =>
					(a.DateCreated || a.DateLastMediaAdded || '') <
					(b.DateCreated || b.DateLastMediaAdded || '')
						? 1
						: -1
				)?.[3]
	);

	function getStatusText(status: RadarrQueueStatus | SonarrQueueStatus) {
		switch (status) {
			case 'failed':
			// TODO
			case 'warning':
			// TODO
			case null:
			case undefined:
			case 'unknown':
				return 'data.unknown';
			default:
				return 'library.content.' + status;
		}
	}

	const radarrDownloadQueue = radarrGetQueue();
	const sonarrDownloadQueue = sonarrGetQueue();
	const radarrDownloadQueueData = $derived(await radarrDownloadQueue);
	const sonarrDownloadQueueData = $derived(await sonarrDownloadQueue);
</script>

{#if noItems}
	<div
		class="h-screen flex items-center justify-center text-zinc-500 p-8"
		in:fade|global={{
			duration: settings.userSettings.interface.animationDuration,
			delay: settings.userSettings.interface.animationDuration
		}}
		out:fade|global={{ duration: settings.userSettings.interface.animationDuration }}
	>
		<h1>
			{$_('library.missingConfiguration')}
		</h1>
	</div>
{:else}
	<div
		in:fade|global={{
			duration: settings.userSettings.interface.animationDuration,
			delay: settings.userSettings.interface.animationDuration
		}}
		out:fade|global={{ duration: settings.userSettings.interface.animationDuration }}
	>
		<div class="relative pt-24">
			{#await showcasePromise then showcase}
				<LazyImg
					src={(showcase && getJellyfinBackdrop(showcase)) || PLACEHOLDER_BACKDROP}
					klass="absolute inset-0"
				/>
			{/await}
			<div class="absolute inset-0 bg-linear-to-t from-stone-950 to-80% to-darken"></div>
			<div
				class="max-w-screen-2xl mx-auto relative z-1 px-2 md:px-8 pt-32 xl:pt-56 pb-12 overflow-hidden"
			>
				<h1
					class="absolute font-bold uppercase text-amber-200 opacity-10 bottom-12 right-8 text-9xl hidden xl:block z-[-1]"
				>
					Library
				</h1>
				<div class="flex gap-4 items-end">
					{#await showcasePromise}
						<div class="w-32 aspect-2/3 placeholder rounded-lg shadow-lg"></div>
						<div class="flex flex-col gap-2">
							<div class="placeholder-text w-20">Placeholder</div>
							<div class="placeholder-text w-[50vw] text-3xl sm:text-4xl md:text-5xl">
								Placeholder
							</div>
							<div class="flex gap-2 mt-2">
								<div class="placeholder-text w-28 h-10"></div>
								<div class="placeholder-text w-28 h-10"></div>
							</div>
						</div>
					{:then showcase}
						<div
							style={"background-image: url('" +
								(showcase ? getJellyfinPosterUrl(showcase) : '') +
								"');"}
							class="w-32 aspect-2/3 rounded-lg bg-center bg-cover shrink-0 shadow-lg"
						></div>
						<div>
							<p class="text-zinc-400 font-medium">{$_('discover.LatestAddition')}</p>
							<h1 class="text-3xl sm:text-4xl md:text-5xl font-semibold">
								{showcase?.Name}
							</h1>
							<div class="flex gap-2 mt-4">
								<Button
									variant="primary"
									onclick={() =>
										showcase?.Id && playerState.streamJellyfinId(showcase?.Id)}
								>
									{$_('library.content.play')}<ChevronRight size="20" />
								</Button>
								<Button
									href={`/${showcase?.Type === 'Movie' ? 'movie' : 'series'}/${
										showcase?.ProviderIds?.Tmdb || showcase?.ProviderIds?.Tvdb
									}`}
								>
									<span>{$_('titleShowcase.details')}</span><ChevronRight
										size="20"
									/>
								</Button>
							</div>
						</div>
					{/await}
				</div>
			</div>
		</div>
	</div>

	<div
		class="py-4 px-2 md:px-8"
		in:fade|global={{
			duration: settings.userSettings.interface.animationDuration,
			delay: settings.userSettings.interface.animationDuration
		}}
		out:fade|global={{ duration: settings.userSettings.interface.animationDuration }}
	>
		<div class="max-w-screen-2xl m-auto flex flex-col gap-12">
			{#if (radarrDownloadQueueData.success && radarrDownloadQueueData.data && radarrDownloadQueueData.data.length > 0) || (sonarrDownloadQueueData.success && sonarrDownloadQueueData.data && sonarrDownloadQueueData.data.length > 0)}
				<Carousel heading={$_('library.content.downloading')}>
					{#if radarrDownloadQueueData.success && radarrDownloadQueueData.data}
						{#each radarrDownloadQueueData.data as item (item.id)}
							<Poster
								tmdbId={item.movie?.tmdbId}
								title={item.movie?.title || ''}
								subtitle={$_(getStatusText(item.status))}
								type="movie"
								backdropUrl={item.movie?.images?.find(
									(i: RadarrMediaCover) => i.coverType === 'poster'
								)?.remoteUrl || ''}
								progress={100 *
									(((item.size || 0) - (item.sizeleft || 0)) / (item.size || 1))}
								orientation="portrait"
							/>
						{/each}
					{/if}
					{#if sonarrDownloadQueueData.success && sonarrDownloadQueueData.data}
						{#each sonarrDownloadQueueData.data as item (item.id)}
							<Poster
								tmdbId={item.series?.tmdbId}
								title={item.episode?.title || ''}
								subtitle={$_(getStatusText(item.status))}
								type="tv"
								backdropUrl={item.series?.images?.find(
									(i: SonarrMediaCover) => i.coverType === 'poster'
								)?.remoteUrl || ''}
								progress={100 *
									(((item.size || 0) - (item.sizeleft || 0)) / (item.size || 1))}
								orientation="portrait"
							/>
						{/each}
					{/if}
				</Carousel>
			{/if}
			<LibraryItems />
		</div>
	</div>
{/if}
