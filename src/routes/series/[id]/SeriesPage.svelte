<script lang="ts">
	import { getJellyfinEpisodes, type JellyfinItem } from '$lib/apis/jellyfin/jellyfinApi';
	import {
		getTmdbSeries,
		getTmdbSeriesRecommendations,
		getTmdbSeriesSeasons,
		getTmdbSeriesSimilar,
		type TmdbSeriesFull2
	} from '$lib/apis/tmdb/tmdbApi';
	import Button from '$lib/components/common/inputs/buttons/Button.svelte';
	import Card from '$lib/components/common/misc/cards/Card.svelte';
	import { fetchCardTmdbProps } from '$lib/components/common/misc/cards/card';
	import Carousel from '$lib/components/common/misc/carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '$lib/components/common/misc/carousel/CarouselPlaceholderItems.svelte';
	import UiCarousel from '$lib/components/common/misc/carousel/UICarousel.svelte';
	import EpisodeCard from '$lib/components/common/misc/cards/EpisodeCard.svelte';
	import PersonCard from '$lib/components/common/misc/cards/PersonCard.svelte';
	import OpenInButton from '$lib/components/TitlePageLayout/OpenInButton.svelte';
	import TitlePageLayout from '$lib/components/TitlePageLayout/TitlePageLayout.svelte';
	import { playerState } from '$lib/components/VideoPlayer/VideoPlayer';
	import { TMDB_BACKDROP_SMALL, TMDB_BASE_TV_URL } from '$lib/constants';
	import { createJellyfinItemStore } from '$lib/stores/data.store';
	import { capitalize, formatSize } from '$lib/utils';
	import classNames from 'classnames';
	import { ActivityLog, Archive, ChevronLeft, ChevronRight, DotFilled } from 'svelte-radix';
	import { _ } from 'svelte-i18n';
	import { tmdbDataFormat } from '$lib/utils.js';
	import { settings } from '$lib/stores/settings.svelte';
	import Select from '$lib/components/common/inputs/forms/Select.svelte';
	import Option from '$lib/components/common/inputs/forms/Option.svelte';
	import { modalStack } from '$lib/stores/modal.store';
	import SeasonsChooserModal from '$lib/components/modals/SeasonsChooserModal.svelte';
	import { onMount } from 'svelte';
	import type { components as SonarrComponents } from '$lib/apis/sonarr/sonarr.generated';
	import { sonarrGetSeries } from '$lib/remote/sonarr.remote';
	import type { SeasonData } from '$lib/types';

	let {
		tmdbId,
		isModal = false,
		handleCloseModal = () => {}
	}: {
		tmdbId: number;
		isModal?: boolean;
		handleCloseModal?: () => void;
	} = $props();

	const jellyfinItemStore = createJellyfinItemStore(tmdbId);

	let loading = $state(true);
	let tmdbSeries: TmdbSeriesFull2 | undefined = $state();
	let seasonSelectVisible = $state(false);
	let visibleSeasonNumber: number = $state(1);
	let nextJellyfinEpisode: JellyfinItem | undefined = $state();
	let sonarrSeries: SonarrComponents['schemas']['SeriesResource'] | undefined = $state();
	let seasonsData: Promise<SeasonData>[] | undefined = $state();

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

	async function preloadRecommendationData() {
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

	async function preloadSeries() {
		tmdbSeries = await getTmdbSeries(tmdbId);
		const tmdbSeasons = getTmdbSeriesSeasons(
			tmdbSeries?.id || 0,
			tmdbSeries?.number_of_seasons || 0
		);

		seasonsData = tmdbSeasons.map((season) =>
			season.then((s) => ({
				overview: s?.overview || '',
				season_number: s?.season_number || 0,
				episodes:
					s?.episodes?.map((episode) => ({
						title: episode?.name || '',
						subtitle: `Episode ${episode?.episode_number}`,
						backdropUrl: TMDB_BACKDROP_SMALL + episode?.still_path || '',
						airDate:
							episode.air_date && new Date(episode.air_date) > new Date()
								? new Date(episode.air_date)
								: undefined
					})) || []
			}))
		);
	}

	function playNextEpisode() {
		if (nextJellyfinEpisode?.Id) playerState.streamJellyfinId(nextJellyfinEpisode?.Id || '');
	}

	let seasonsChooserClose: (coucou: boolean | undefined) => void;

	function showSeasonsChooser(): Promise<boolean | undefined> {
		modalStack.create(SeasonsChooserModal, {
			endChoice: seasonsChooserClose,
			seasonsData
		});

		return new Promise((resolve) => {
			seasonsChooserClose = resolve;
		});
	}

	let addToSonarrLoading = $state(false);
	async function addToSonarr() {
		addToSonarrLoading = true;

		const res = await showSeasonsChooser();
		console.log(res);
		/*addSeriesToSonarr(tmdbId).then(() => {
			refreshSonarr();
			createSuccessNotification(
				'Episode(s) added to queue',
				'The episode(s) will be added to the library once available.'
			);
		});*/
	}

	onMount(async () => {
		await Promise.all([sonarrGetSeries(), preloadSeries()]);
		sonarrSeries = sonarrGetSeries().current?.data?.find((s) => s.tmdbId === tmdbId);

		loading = false;
	});

	// Focus next episode on load
	let didFocusNextEpisode = false;
	$effect(() => {
		if (episodeComponents && !didFocusNextEpisode) {
			const episodeComponent = nextJellyfinEpisode?.IndexNumber
				? episodeComponents[nextJellyfinEpisode?.IndexNumber - 1]
				: undefined;

			if (
				episodeComponent &&
				nextJellyfinEpisode?.ParentIndexNumber === visibleSeasonNumber
			) {
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

{#if loading}
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
{:else}
	<TitlePageLayout
		titleInformation={{
			tmdbId,
			type: 'tv',
			backdropUriCandidates:
				tmdbSeries?.images?.backdrops?.map((b) => b.file_path || '') || [],
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
			{tmdbSeries?.status
				? $_('data.status.' + tmdbDataFormat(tmdbSeries?.status))
				: undefined}
			<DotFilled />
			<a href={TMDB_BASE_TV_URL + tmdbId} target="_blank"
				>{tmdbSeries?.vote_average?.toFixed(1)} TMDB</a
			>
		{/snippet}

		{#snippet title_right()}
			<div
				class="flex gap-2 items-center flex-row-reverse justify-end lg:flex-row lg:justify-start"
			>
				{#if $jellyfinItemStore.loading || sonarrGetSeries().loading}
					<div class="placeholder h-10 w-48 rounded-xl"></div>
				{:else}
					<OpenInButton
						title={tmdbSeries?.name}
						jellyfinItem={$jellyfinItemStore.item}
						type="tv"
						{tmdbId}
					/>
					{#if !!nextJellyfinEpisode}
						<Button variant="primary" onclick={playNextEpisode}>
							<span>
								{$_('library.content.play')}
								{`S${nextJellyfinEpisode?.ParentIndexNumber}E${nextJellyfinEpisode?.IndexNumber}`}
							</span>
							<ChevronRight size="20" />
						</Button>
					{:else if !sonarrSeries && settings.globalSettings.sonarr.baseUrl}
						<Select
							disabled={addToSonarrLoading}
							onchange={addToSonarr}
							placeholder={$_('library.content.get')}
							variant="primary"
							showOnlyPlaceholder
						>
							{#each settings.globalSettings.general.downloadLanguages as language}
								<Option value={language} label={$_('languages.' + language)} />
							{/each}
						</Select>
					{:else if sonarrSeries}
						<Button variant="primary" disabled>
							<ActivityLog size="20" /><span class="ml-2"
								>{$_('library.content.queued')}</span
							>
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
						{#each [...Array(tmdbSeries?.number_of_seasons || 0).keys()].map((i) => i + 1) as seasonNumber (seasonNumber)}
							{@const season = tmdbSeries?.seasons?.find(
								(s) => s.season_number === seasonNumber
							)}
							{@const isSelected = season?.season_number === visibleSeasonNumber}
							<button
								class={classNames(
									'font-medium tracking-wide transition-colors shrink-0 flex items-center gap-1',
									{
										'text-zinc-200': isSelected && seasonSelectVisible,
										'text-zinc-500 hover:text-zinc-200 cursor-pointer':
											(!isSelected || seasonSelectVisible === false) &&
											tmdbSeries?.number_of_seasons !== 1,
										'text-zinc-500 cursor-default':
											tmdbSeries?.number_of_seasons === 1,
										hidden:
											!seasonSelectVisible &&
											visibleSeasonNumber !== (season?.season_number || 1)
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
									class={seasonSelectVisible ||
									tmdbSeries?.number_of_seasons === 1
										? 'hidden'
										: ''}
								/>
								{$_('library.content.season')}
								{season?.season_number}
							</button>
						{/each}
					</UiCarousel>
				{/snippet}
				{#key visibleSeasonNumber}
					{#if seasonsData}
						{#await seasonsData[visibleSeasonNumber - 1]}
							<CarouselPlaceholderItems />
						{:then season}
							{#each season.episodes || [] as props, i (props)}
								{@const jellyfinData =
									jellyfinEpisodeData[`S${visibleSeasonNumber}E${i + 1}`]}
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
										onclick={() => {}}
									/>
								</div>
							{:else}
								<CarouselPlaceholderItems />
							{/each}
						{/await}
					{/if}
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
						{new Date(tmdbSeries?.first_air_date).toLocaleDateString(
							settings.userSettings.interface.language,
							{
								year: 'numeric',
								month: 'short',
								day: 'numeric'
							}
						)}
					</h2>
				</div>
			{/if}
			{#if ['Returning Series', 'In Production', 'Planned'].includes(tmdbSeries?.status ?? '')}
				<div class="col-span-2 lg:col-span-1">
					<p class="text-zinc-400 text-sm">{$_('library.content.nextAirDate')}</p>
					<h2 class="font-medium">
						{tmdbSeries?.status}
					</h2>
				</div>
			{:else if tmdbSeries?.last_air_date}
				<div class="col-span-2 lg:col-span-1">
					<p class="text-zinc-400 text-sm">{$_('library.content.lastAirDate')}</p>
					<h2 class="font-medium">
						{new Date(tmdbSeries.last_air_date).toLocaleDateString(
							settings.userSettings.interface.language,
							{
								year: 'numeric',
								month: 'short',
								day: 'numeric'
							}
						)}
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
					{tmdbSeries?.spoken_languages
						?.map((l) => capitalize(l.english_name || ''))
						.join(', ')}
				</h2>
			</div>
		{/snippet}

		{#snippet servarr_components()}
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

				<div class="flex gap-4 flex-wrap col-span-4 sm:col-span-6 mt-4">
					<Button>
						<span class="mr-2">{$_('library.content.manage')}</span><Archive
							size="20"
						/>
					</Button>
				</div>
			{:else if sonarrGetSeries().loading}
				<div class="flex gap-4 flex-wrap col-span-4 sm:col-span-6 mt-4">
					<div class="placeholder h-10 w-40 rounded-xl"></div>
					<div class="placeholder h-10 w-40 rounded-xl"></div>
				</div>
			{/if}
		{/snippet}

		{#snippet carousels()}
			{#await preloadRecommendationData()}
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
							<div class="font-medium text-lg">
								{$_('library.content.castAndCrew')}
							</div>
						{/snippet}
						{#each castProps as castProp (castProp)}
							<PersonCard {...castProp} />
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
						{#each tmdbRecommendationProps as tmdbRecommendationProp (tmdbRecommendationProp)}
							<Card {...tmdbRecommendationProp} openInModal={isModal} />
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
						{#each tmdbSimilarProps as tmdbSimilarProp (tmdbSimilarProp)}
							<Card {...tmdbSimilarProp} openInModal={isModal} />
						{/each}
					</Carousel>
				{/if}
			{/await}
		{/snippet}
	</TitlePageLayout>
{/if}
