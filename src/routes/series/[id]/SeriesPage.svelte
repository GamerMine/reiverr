<script lang="ts">
	import { getJellyfinEpisodes, type JellyfinItem } from '$lib/apis/jellyfin/jellyfinApi';
	import { addSeriesToSonarr } from '$lib/apis/sonarr/sonarrApi';
	import {
		getTmdbIdFromTvdbId,
		getTmdbSeries,
		getTmdbSeriesRecommendations,
		getTmdbSeriesSeasons,
		getTmdbSeriesSimilar,
		type TmdbSeriesFull2
	} from '$lib/apis/tmdb/tmdbApi';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card/Card.svelte';
	import { fetchCardTmdbProps } from '$lib/components/Card/card';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '$lib/components/Carousel/CarouselPlaceholderItems.svelte';
	import UiCarousel from '$lib/components/Carousel/UICarousel.svelte';
	import EpisodeCard from '$lib/components/EpisodeCard/EpisodeCard.svelte';
	import PersonCard from '$lib/components/PersonCard/PersonCard.svelte';
	import SeriesRequestModal from '$lib/components/RequestModal/SeriesRequestModal.svelte';
	import OpenInButton from '$lib/components/TitlePageLayout/OpenInButton.svelte';
	import TitlePageLayout from '$lib/components/TitlePageLayout/TitlePageLayout.svelte';
	import { playerState } from '$lib/components/VideoPlayer/VideoPlayer';
	import { TMDB_BACKDROP_SMALL } from '$lib/constants';
	import {
		createJellyfinItemStore,
		createSonarrDownloadStore,
		createSonarrSeriesStore
	} from '$lib/stores/data.store';
	import { modalStack } from '$lib/stores/modal.store';
	import { settings } from '$lib/stores/settings.store';
	import type { TitleId } from '$lib/types';
	import { capitalize, formatMinutesToTime, formatSize } from '$lib/utils';
	import classNames from 'classnames';
	import { Archive, ChevronLeft, ChevronRight, DotFilled, Plus } from 'svelte-radix';
	import { get } from 'svelte/store';
	import { _ } from 'svelte-i18n';
	import { tmdbDataFormat } from '$lib/utils.js';

	let {
		titleId,
		isModal = false,
		handleCloseModal = () => {}
	}: {
		titleId: TitleId;
		isModal?: boolean;
		handleCloseModal?: () => void;
	} = $props();

	const data = loadInitialPageData();
	const recommendationData = preloadRecommendationData();

	const jellyfinItemStore = createJellyfinItemStore(data.then((d) => d.tmdbId));
	const sonarrSeriesStore = createSonarrSeriesStore(data.then((d) => d.tmdbSeries?.name || ''));
	const sonarrDownloadStore = createSonarrDownloadStore(sonarrSeriesStore);

	let seasonSelectVisible = $state(false);
	let visibleSeasonNumber: number = $state(1);
	let visibleEpisodeIndex: number | undefined = $state();
	let nextJellyfinEpisode: JellyfinItem | undefined = $state();

	const jellyfinEpisodeData: {
		[key: string]: {
			jellyfinId: string | undefined;
			progress: number;
			watched: boolean;
		};
	} = {};
	const episodeComponents: HTMLDivElement[] = [];

	// Refresh jellyfin episode data
	jellyfinItemStore.subscribe(async (value) => {
		const item = value.item;
		if (!item?.Id) return;
		const episodes = await getJellyfinEpisodes(item.Id);

		episodes?.forEach((episode) => {
			const key = `S${episode?.ParentIndexNumber}E${episode?.IndexNumber}`;

			if (!nextJellyfinEpisode && episode?.UserData?.Played === false) {
				nextJellyfinEpisode = episode;
			}

			jellyfinEpisodeData[key] = {
				jellyfinId: episode?.Id,
				progress: episode?.UserData?.PlayedPercentage || 0,
				watched: episode?.UserData?.Played || false
			};
		});

		if (!nextJellyfinEpisode) nextJellyfinEpisode = episodes?.[0];
		visibleSeasonNumber = nextJellyfinEpisode?.ParentIndexNumber || visibleSeasonNumber;
	});

	async function loadInitialPageData() {
		const tmdbId = await (titleId.provider === 'tvdb'
			? getTmdbIdFromTvdbId(titleId.id)
			: Promise.resolve(titleId.id));
		const tmdbSeries = await getTmdbSeries(tmdbId);

		return {
			tmdbId,
			tmdbUrl: 'https://www.themoviedb.org/tv/' + tmdbId,
			tmdbSeries,
			seasonsData: preloadAndMapSeasonsData(tmdbSeries)
		};
	}

	async function preloadRecommendationData() {
		const { tmdbId, tmdbSeries } = await data;
		const tmdbRecommendationProps = getTmdbSeriesRecommendations(tmdbId).then((r) =>
			Promise.all(r.map(fetchCardTmdbProps))
		);

		const tmdbSimilarProps = getTmdbSeriesSimilar(tmdbId)
			.then((r) => Promise.all(r.map(fetchCardTmdbProps)))
			.then((r) => r.filter((p) => p.backdropUrl));

		const castProps =
			tmdbSeries?.aggregate_credits?.cast?.slice(0, 20)?.map((m) => ({
				tmdbId: m.id || 0,
				backdropUri: m.profile_path || '',
				name: m.name || '',
				subtitle: m.roles?.[0]?.character || m.known_for_department || ''
			})) || [];

		return {
			tmdbRecommendationProps: await tmdbRecommendationProps,
			tmdbSimilarProps: await tmdbSimilarProps,
			castProps
		};
	}

	function preloadAndMapSeasonsData(tmdbSeries: TmdbSeriesFull2 | undefined) {
		const tmdbSeasons = getTmdbSeriesSeasons(
			tmdbSeries?.id || 0,
			tmdbSeries?.number_of_seasons || 0
		);

		return tmdbSeasons.map((season) =>
			season.then(
				(s) =>
					s?.episodes?.map((episode) => ({
						title: episode?.name || '',
						subtitle: `Episode ${episode?.episode_number}`,
						backdropUrl: TMDB_BACKDROP_SMALL + episode?.still_path || '',
						airDate:
							episode.air_date && new Date(episode.air_date) > new Date()
								? new Date(episode.air_date)
								: undefined
					})) || []
			)
		);
	}

	function playNextEpisode() {
		if (nextJellyfinEpisode?.Id) playerState.streamJellyfinId(nextJellyfinEpisode?.Id || '');
	}

	async function refreshSonarr() {
		await sonarrSeriesStore.refreshIn();
	}

	let addToSonarrLoading = $state(false);
	async function addToSonarr() {
		const tmdbId = await data.then((d) => d.tmdbId);
		addToSonarrLoading = true;
		addSeriesToSonarr(tmdbId)
			.then(refreshSonarr)
			.finally(() => (addToSonarrLoading = false));
	}

	async function openRequestModal() {
		const sonarrSeries = get(sonarrSeriesStore).item;

		if (!sonarrSeries?.id || !sonarrSeries?.statistics?.seasonCount) return;

		modalStack.create(SeriesRequestModal, {
			sonarrId: sonarrSeries?.id || 0,
			seasons: sonarrSeries?.statistics?.seasonCount || 0,
			heading: sonarrSeries?.title || 'Series'
		});
	}

	// Focus next episode on load
	let didFocusNextEpisode = false;
	$effect(() => {
		if (episodeComponents && !didFocusNextEpisode) {
			const episodeComponent = nextJellyfinEpisode?.IndexNumber
				? episodeComponents[nextJellyfinEpisode?.IndexNumber - 1]
				: undefined;

			if (episodeComponent && nextJellyfinEpisode?.ParentIndexNumber === visibleSeasonNumber) {
				const parent = episodeComponent.offsetParent;

				if (parent) {
					parent.scrollTo({
						left:
							episodeComponent.offsetLeft -
							document.body.clientWidth / 2 +
							episodeComponent.clientWidth / 2,
						behavior: 'smooth'
					});

					didFocusNextEpisode = true;
				}
			}
		}
	});
</script>

{#await data}
	<TitlePageLayout {isModal} {handleCloseModal}>
		{#snippet episodes_carousel()}
			<Carousel
				gradientFromColor="from-red-950"
				klass={classNames('px-2 sm:px-4 lg:px-8', {
					'2xl:px-0': !isModal
				})}
				heading="Episodes"
			>
				<CarouselPlaceholderItems />
			</Carousel>
		{/snippet}
	</TitlePageLayout>
{:then { tmdbId, tmdbUrl, tmdbSeries, seasonsData }}
	<TitlePageLayout
		titleInformation={{
			tmdbId,
			type: 'series',
			backdropUriCandidates: tmdbSeries?.images?.backdrops?.map((b) => b.file_path || '') || [],
			posterPath: tmdbSeries?.poster_path || '',
			title: tmdbSeries?.name || '',
			tagline: tmdbSeries?.tagline || tmdbSeries?.name || '',
			overview: tmdbSeries?.overview || ''
		}}
		{isModal}
		{handleCloseModal}
	>
		{#snippet title_info()}
			{new Date(tmdbSeries?.first_air_date || Date.now()).getFullYear()}
			<DotFilled />
			{tmdbSeries?.status ? $_('data.status.' + tmdbDataFormat(tmdbSeries?.status)) : undefined}
			<DotFilled />
			<a href={tmdbUrl} target="_blank">{tmdbSeries?.vote_average?.toFixed(1)} TMDB</a>
		{/snippet}

		{#snippet title_right()}
			<div
				class="flex gap-2 items-center flex-row-reverse justify-end lg:flex-row lg:justify-start"
			>
				{#if $jellyfinItemStore.loading || $sonarrSeriesStore.loading}
					<div class="placeholder h-10 w-48 rounded-xl"></div>
				{:else}
					<OpenInButton
						title={tmdbSeries?.name}
						jellyfinItem={$jellyfinItemStore.item}
						sonarrSeries={$sonarrSeriesStore.item}
						type="series"
						{tmdbId}
					/>
					{#if !!nextJellyfinEpisode}
						<Button type="primary" onclick={playNextEpisode}>
							<span>
								{$_('library.content.play')}
								{`S${nextJellyfinEpisode?.ParentIndexNumber}E${nextJellyfinEpisode?.IndexNumber}`}
							</span>
							<ChevronRight size="20" />
						</Button>
					{:else if !$sonarrSeriesStore.item && $settings.sonarr.apiKey && $settings.sonarr.baseUrl}
						<Button type="primary" disabled={addToSonarrLoading} onclick={addToSonarr}>
							<span>{$_('library.content.addSonarr')}</span><Plus size="20" />
						</Button>
					{:else if $sonarrSeriesStore.item}
						<Button type="primary" onclick={openRequestModal}>
							<span class="mr-2">{$_('library.content.requestSeries')}</span><Plus size="20" />
						</Button>
					{/if}
				{/if}
			</div>
		{/snippet}

		{#snippet episodes_carousel()}
			<Carousel
				gradientFromColor="from-stone-950"
				klass={classNames('px-2 sm:px-4 lg:px-8', {
					'2xl:px-0': !isModal
				})}
			>
				{#snippet title()}
					<UiCarousel klass="flex gap-6">
						{#each [...Array(tmdbSeries?.number_of_seasons || 0).keys()].map((i) => i + 1) as seasonNumber}
							{@const season = tmdbSeries?.seasons?.find((s) => s.season_number === seasonNumber)}
							{@const isSelected = season?.season_number === visibleSeasonNumber}
							<button
								class={classNames(
									'font-medium tracking-wide transition-colors shrink-0 flex items-center gap-1',
									{
										'text-zinc-200': isSelected && seasonSelectVisible,
										'text-zinc-500 hover:text-zinc-200 cursor-pointer':
											(!isSelected || seasonSelectVisible === false) &&
											tmdbSeries?.number_of_seasons !== 1,
										'text-zinc-500 cursor-default': tmdbSeries?.number_of_seasons === 1,
										hidden:
											!seasonSelectVisible && visibleSeasonNumber !== (season?.season_number || 1)
									}
								)}
								onclick={() => {
									if (tmdbSeries?.number_of_seasons === 1) return;

									if (seasonSelectVisible) {
										visibleSeasonNumber = season?.season_number || 1;
										seasonSelectVisible = false;
									} else {
										seasonSelectVisible = true;
									}
								}}
							>
								<ChevronLeft
									size="20"
									class={seasonSelectVisible || tmdbSeries?.number_of_seasons === 1 ? 'hidden' : ''}
								/>
								{$_('library.content.season')}
								{season?.season_number}
							</button>
						{/each}
					</UiCarousel>
				{/snippet}
				{#key visibleSeasonNumber}
					{#await seasonsData[visibleSeasonNumber - 1]}
						<CarouselPlaceholderItems />
					{:then seasonEpisodes}
						{#each seasonEpisodes || [] as props, i}
							{@const jellyfinData = jellyfinEpisodeData[`S${visibleSeasonNumber}E${i + 1}`]}
							<div bind:this={episodeComponents[i]}>
								<EpisodeCard
									{...props}
									{...jellyfinData
										? {
												watched: jellyfinData.watched,
												progress: jellyfinData.progress,
												jellyfinId: jellyfinData.jellyfinId
											}
										: {}}
									onclick={() => (visibleEpisodeIndex = i)}
								/>
							</div>
						{:else}
							<CarouselPlaceholderItems />
						{/each}
					{/await}
				{/key}
			</Carousel>
		{/snippet}

		{#snippet info_components()}
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">{$_('library.content.directedBy')}</p>
				<h2 class="font-medium">{tmdbSeries?.created_by?.map((c) => c.name).join(', ')}</h2>
			</div>
			{#if tmdbSeries?.first_air_date}
				<div class="col-span-2 lg:col-span-1">
					<p class="text-zinc-400 text-sm">{$_('library.content.firstAirDate')}</p>
					<h2 class="font-medium">
						{new Date(tmdbSeries?.first_air_date).toLocaleDateString($settings.language, {
							year: 'numeric',
							month: 'short',
							day: 'numeric'
						})}
					</h2>
				</div>
			{/if}
			{#if tmdbSeries?.next_episode_to_air}
				<div class="col-span-2 lg:col-span-1">
					<p class="text-zinc-400 text-sm">{$_('library.content.nextAirDate')}</p>
					<h2 class="font-medium">
						{new Date(tmdbSeries.next_episode_to_air?.air_date).toLocaleDateString(
							$settings.language,
							{
								year: 'numeric',
								month: 'short',
								day: 'numeric'
							}
						)}
					</h2>
				</div>
			{:else if tmdbSeries?.last_air_date}
				<div class="col-span-2 lg:col-span-1">
					<p class="text-zinc-400 text-sm">{$_('library.content.lastAirDate')}</p>
					<h2 class="font-medium">
						{new Date(tmdbSeries.last_air_date).toLocaleDateString($settings.language, {
							year: 'numeric',
							month: 'short',
							day: 'numeric'
						})}
					</h2>
				</div>
			{/if}
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">{$_('library.content.networks')}</p>
				<h2 class="font-medium">{tmdbSeries?.networks?.map((n) => n.name).join(', ')}</h2>
			</div>
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">{$_('library.content.episodeRunTime')}</p>
				<h2 class="font-medium">{tmdbSeries?.episode_run_time} Minutes</h2>
			</div>
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">{$_('library.content.spokenLanguages')}</p>
				<h2 class="font-medium">
					{tmdbSeries?.spoken_languages?.map((l) => capitalize(l.english_name || '')).join(', ')}
				</h2>
			</div>
		{/snippet}

		{#snippet servarr_components()}
			{@const sonarrSeries = $sonarrSeriesStore.item}
			{#if sonarrSeries}
				{#if sonarrSeries?.statistics?.episodeFileCount}
					<div class="col-span-2 lg:col-span-1">
						<p class="text-zinc-400 text-sm">{$_('library.content.available')}</p>
						<h2 class="font-medium">
							{sonarrSeries?.statistics?.episodeFileCount || 0} Episodes
						</h2>
					</div>
				{/if}
				{#if sonarrSeries?.statistics?.sizeOnDisk}
					<div class="col-span-2 lg:col-span-1">
						<p class="text-zinc-400 text-sm">{$_('library.content.sizeDisk')}</p>
						<h2 class="font-medium">
							{formatSize(sonarrSeries?.statistics?.sizeOnDisk || 0)}
						</h2>
					</div>
				{/if}
				{#if $sonarrDownloadStore.downloads?.length}
					{@const download = $sonarrDownloadStore.downloads?.[0]}
					<div class="col-span-2 lg:col-span-1">
						<p class="text-zinc-400 text-sm">{$_('library.content.downloadCompletedIn')}</p>
						<h2 class="font-medium">
							{download?.estimatedCompletionTime
								? formatMinutesToTime(
										(new Date(download?.estimatedCompletionTime).getTime() - Date.now()) / 1000 / 60
									)
								: 'Stalled'}
						</h2>
					</div>
				{/if}

				<div class="flex gap-4 flex-wrap col-span-4 sm:col-span-6 mt-4">
					<Button onclick={openRequestModal}>
						<span class="mr-2">{$_('library.content.requestSeries')}</span><Plus size="20" />
					</Button>
					<Button>
						<span class="mr-2">{$_('library.content.manage')}</span><Archive size="20" />
					</Button>
				</div>
			{:else if $sonarrSeriesStore.loading}
				<div class="flex gap-4 flex-wrap col-span-4 sm:col-span-6 mt-4">
					<div class="placeholder h-10 w-40 rounded-xl"></div>
					<div class="placeholder h-10 w-40 rounded-xl"></div>
				</div>
			{/if}
		{/snippet}

		{#snippet carousels()}
			{#await recommendationData}
				<Carousel gradientFromColor="from-stone-950">
					{#snippet title()}
						<div class="font-medium text-lg">{$_('library.content.castAndCrew')}</div>
					{/snippet}
					<CarouselPlaceholderItems />
				</Carousel>

				<Carousel gradientFromColor="from-stone-950">
					{#snippet title()}
						<div class="font-medium text-lg">
							{$_('library.content.recommendations')}
						</div>
					{/snippet}
					<CarouselPlaceholderItems />
				</Carousel>

				<Carousel gradientFromColor="from-stone-950">
					{#snippet title()}
						<div class="font-medium text-lg">{$_('library.content.similarSeries')}</div>
					{/snippet}
					<CarouselPlaceholderItems />
				</Carousel>
			{:then { castProps, tmdbRecommendationProps, tmdbSimilarProps }}
				{#if castProps?.length}
					<Carousel gradientFromColor="from-stone-950">
						{#snippet title()}
							<div class="font-medium text-lg">{$_('library.content.castAndCrew')}</div>
						{/snippet}
						{#each castProps as prop}
							<PersonCard {...prop} />
						{/each}
					</Carousel>
				{/if}

				{#if tmdbRecommendationProps?.length}
					<Carousel gradientFromColor="from-stone-950">
						{#snippet title()}
							<div class="font-medium text-lg">
								{$_('library.content.recommendations')}
							</div>
						{/snippet}
						{#each tmdbRecommendationProps as prop}
							<Card {...prop} openInModal={isModal} />
						{/each}
					</Carousel>
				{/if}

				{#if tmdbSimilarProps?.length}
					<Carousel gradientFromColor="from-stone-950">
						{#snippet title()}
							<div class="font-medium text-lg">
								{$_('library.content.similarSeries')}
							</div>
						{/snippet}
						{#each tmdbSimilarProps as prop}
							<Card {...prop} openInModal={isModal} />
						{/each}
					</Carousel>
				{/if}
			{/await}
		{/snippet}
	</TitlePageLayout>
{/await}
