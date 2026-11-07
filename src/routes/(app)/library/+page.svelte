<script lang="ts">
	import Button from '#lib/components/controls/Button.svelte';
	import Carousel from '#lib/components/carousel/Carousel.svelte';
	import Poster from '#lib/components/cards/Poster.svelte';
	import { playerState } from '#lib/components/player/VideoPlayer.js';
	import { PLACEHOLDER_BACKDROP } from '#lib/utils/constants.js';
	import { ChevronRight } from 'svelte-radix';
	import { _ } from 'svelte-i18n';
	import { fade } from 'svelte/transition';
	import LibraryItems from './LibraryItems.svelte';
	import LazyImg from '#lib/components/images/LazyImg.svelte';
	import { settings } from '#lib/stores/settings.svelte.js';
	import { radarrGetQueue } from '#lib/remote/radarr.remote.js';
	import { sonarrGetQueue } from '#lib/remote/sonarr.remote.js';
	import { jellyfinGetItems } from '#lib/remote/jellyfin.remote.js';
	import type { RadarrMediaCover, RadarrQueueStatus } from '@reiverr/connectors/types/radarr';
	import type { SonarrMediaCover, SonarrQueueStatus } from '@reiverr/connectors/types/radarr';
	import type { JellyfinBaseItemDto } from '@reiverr/connectors/types/radarr';
	import { getJellyfinBackdrop, getJellyfinPosterUrl } from '#lib/utils/utils.ts';

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
		class="flex h-screen items-center justify-center p-8 text-zinc-500"
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
			<div class="to-darken absolute inset-0 bg-linear-to-t from-stone-950 to-80%"></div>
			<div
				class="relative z-1 mx-auto max-w-screen-2xl overflow-hidden px-2 pt-32 pb-12 md:px-8 xl:pt-56"
			>
				<h1
					class="absolute right-8 bottom-12 z-[-1] hidden text-9xl font-bold text-amber-200 uppercase opacity-10 xl:block"
				>
					Library
				</h1>
				<div class="flex items-end gap-4">
					{#await showcasePromise}
						<div class="placeholder aspect-2/3 w-32 rounded-lg shadow-lg"></div>
						<div class="flex flex-col gap-2">
							<div class="placeholder-text w-20">Placeholder</div>
							<div class="placeholder-text w-[50vw] text-3xl sm:text-4xl md:text-5xl">
								Placeholder
							</div>
							<div class="mt-2 flex gap-2">
								<div class="placeholder-text h-10 w-28"></div>
								<div class="placeholder-text h-10 w-28"></div>
							</div>
						</div>
					{:then showcase}
						<div
							style={"background-image: url('" +
								(showcase ? getJellyfinPosterUrl(showcase) : '') +
								"');"}
							class="aspect-2/3 w-32 shrink-0 rounded-lg bg-cover bg-center shadow-lg"
						></div>
						<div>
							<p class="font-medium text-zinc-400">{$_('discover.LatestAddition')}</p>
							<h1 class="text-3xl font-semibold sm:text-4xl md:text-5xl">
								{showcase?.Name}
							</h1>
							<div class="mt-4 flex gap-2">
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
		class="px-2 py-4 md:px-8"
		in:fade|global={{
			duration: settings.userSettings.interface.animationDuration,
			delay: settings.userSettings.interface.animationDuration
		}}
		out:fade|global={{ duration: settings.userSettings.interface.animationDuration }}
	>
		<div class="m-auto flex max-w-screen-2xl flex-col gap-12">
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
