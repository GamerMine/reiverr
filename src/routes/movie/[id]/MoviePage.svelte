<script lang="ts">
	import {
		getTmdbMovie,
		getTmdbMovieRecommendations,
		getTmdbMovieSimilar,
		type TmdbMovieFull2
	} from '$lib/apis/tmdb/tmdbApi';
	import Button from '$lib/components/controls/Button.svelte';
	import Card from '$lib/components/cards/Card.svelte';
	import { fetchCardTmdbProps } from '$lib/components/cards/card';
	import Carousel from '$lib/components/carousel/Carousel.svelte';
	import CarouselPlaceholderItems from '$lib/components/carousel/CarouselPlaceholderItems.svelte';
	import PersonCard from '$lib/components/cards/PersonCard.svelte';
	import ProgressBar from '$lib/components/layout/ProgressBar.svelte';
	import OpenInButton from '$lib/components/TitlePageLayout/OpenInButton.svelte';
	import TitlePageLayout from '$lib/components/TitlePageLayout/TitlePageLayout.svelte';
	import { playerState } from '$lib/components/player/VideoPlayer';
	import { formatSize } from '$lib/utils/utils';
	import classNames from 'classnames';
	import { ActivityLog, ChevronRight, Clock, DotFilled, Trash } from 'svelte-radix';
	import { type ComponentProps, onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { settings } from '$lib/stores/settings.svelte';
	import { radarrAddMovie, radarrGetMovies, radarrRemoveMovie } from '$lib/remote/radarr.remote';
	import Select from '$lib/components/controls/Select.svelte';
	import Option from '$lib/components/controls/Option.svelte';
	import { TMDB_BASE_MOVIE_URL } from '$lib/utils/constants';
	import { jellyfinGetItems } from '$lib/remote/jellyfin.remote';
	import {
		createErrorNotification,
		createSuccessNotification
	} from '$lib/stores/notification.store';
	import type { RadarrMovieResource } from '@reiverr/connectors/types/radarr';
	import type { JellyfinBaseItemDto } from '@reiverr/connectors/types/jellyfin';
	import { getQueuedTasks } from '$lib/remote/tasks.remote.ts';
	import { type MovieAdd, type MovieRemove } from '../../../tasksWorker/types.ts';
	import { TaskType } from '@reiverr/db/types';
	import ConfirmDialog from '$lib/components/controls/ConfirmDialog.svelte';

	let {
		tmdbId,
		isModal = false,
		handleCloseModal = () => {}
	}: { tmdbId: number; isModal?: boolean; handleCloseModal?: () => void } = $props();

	let loading = $state(true);
	let tmdbMovie: TmdbMovieFull2 | undefined = $state();
	let jellyfinItem: JellyfinBaseItemDto | undefined = $state();
	let radarrMovie: RadarrMovieResource | undefined = $state();
	let tasks = $derived(await getQueuedTasks(true));
	let isBeingAdded = $state(false);
	let isBeingRemoved = $state(false);
	let showRemoveConfirmDialog = $state(false);

	async function preloadRecommendationData() {
		const tmdbRecommendationProps = getTmdbMovieRecommendations(tmdbId)
			.then((r) => Promise.all<ComponentProps<typeof Card>>(r.map(fetchCardTmdbProps)))
			.then((r) => r.filter((p) => p.backdropUrl));
		const tmdbSimilarProps = getTmdbMovieSimilar(tmdbId)
			.then((r) => Promise.all(r.map(fetchCardTmdbProps)))
			.then((r) => r.filter((p) => p.backdropUrl));

		const castPropsPromise =
			tmdbMovie?.credits?.cast?.slice(0, 20).map((m) => ({
				tmdbId: m.id || 0,
				backdropUri: m.profile_path || '',
				name: m.name || '',
				subtitle: m.character || m.known_for_department || ''
			})) || [];

		return {
			tmdbRecommendationProps: await tmdbRecommendationProps,
			tmdbSimilarProps: await tmdbSimilarProps,
			castProps: castPropsPromise
		};
	}

	function play() {
		if (jellyfinItem?.Id) playerState.streamJellyfinId(jellyfinItem.Id);
	}

	let addToRadarrLoading = $state(false);
	function addToRadarr(language: string) {
		addToRadarrLoading = true;

		radarrAddMovie({
			tmdbId,
			name: tmdbMovie?.title || '',
			language,
			userId: JSON.parse(localStorage.getItem('user') || '{}').Id
		}).then((res) => {
			if (res.success)
				createSuccessNotification(
					$_('ui.notification.header.movieAdded'),
					$_('ui.notification.description.movieAdded')
				);
			else
				createErrorNotification(
					$_('general.error'),
					$_(res.error ?? 'general.unknownError')
				);
			addToRadarrLoading = false;
		});
	}

	async function removeMovie(confirm: boolean) {
		showRemoveConfirmDialog = false;
		if (confirm && radarrMovie?.id) {
			isBeingRemoved = true;
			radarrRemoveMovie({
				radarrId: radarrMovie.id,
				name: tmdbMovie?.title || radarrMovie.title
			});
		}
	}

	$effect(() => {
		const addState = tasks.find(
			(t) => t.type === TaskType.RADARR_MOVIE_ADD && (t.data as MovieAdd).tmdbId === tmdbId
		);
		const removeState = tasks.find(
			(t) =>
				t.type === TaskType.RADARR_MOVIE_REMOVE &&
				(t.data as MovieRemove).radarrId === radarrMovie?.id
		);
		isBeingAdded = !!addState;
		isBeingRemoved = !!removeState;
		console.log(isBeingRemoved);
		if (!isBeingAdded || !isBeingRemoved) {
			radarrGetMovies()
				.refresh()
				.then(() => {
					radarrMovie = radarrGetMovies().current?.data?.find((m) => m.tmdbId === tmdbId);
				});
			jellyfinGetItems()
				.refresh()
				.then(() => {
					jellyfinItem = jellyfinGetItems().current?.data?.find(
						(i) => i.ProviderIds?.Tmdb === tmdbId.toString()
					);
				});
		}
	});

	onMount(async () => {
		const resolved = await Promise.all([
			radarrGetMovies(),
			jellyfinGetItems(),
			getTmdbMovie(tmdbId)
		]);
		tmdbMovie = resolved[2];
		radarrMovie = radarrGetMovies().current?.data?.find((m) => m.tmdbId === tmdbId);
		jellyfinItem = jellyfinGetItems().current?.data?.find(
			(i) => i.ProviderIds?.Tmdb === tmdbId.toString()
		);
		loading = false;
	});
</script>

{#if loading}
	<TitlePageLayout {isModal} {handleCloseModal} />
{:else}
	<TitlePageLayout
		titleInformation={{
			tmdbId,
			type: 'movie',
			title: tmdbMovie?.title || 'Movie',
			backdropUriCandidates:
				tmdbMovie?.images?.backdrops?.map((b) => b.file_path || '') || [],
			posterPath: tmdbMovie?.poster_path || '',
			tagline: tmdbMovie?.tagline || tmdbMovie?.title || '',
			overview: tmdbMovie?.overview || ''
		}}
		{isModal}
		{handleCloseModal}
	>
		{#snippet title_info()}
			{new Date(tmdbMovie?.release_date || Date.now()).getFullYear()}
			<DotFilled />
			{@const progress = jellyfinItem?.UserData?.PlayedPercentage}
			{#if progress}
				{progress.toFixed()} {$_('library.content.minLeft')}
			{:else}
				{tmdbMovie?.runtime} min
			{/if}
			<DotFilled />
			<a href={TMDB_BASE_MOVIE_URL + tmdbId} target="_blank"
				>{tmdbMovie?.vote_average?.toFixed(1)} TMDB</a
			>
		{/snippet}
		{#snippet episodes_carousel()}
			{@const progress = jellyfinItem?.UserData?.PlayedPercentage}
			{#if progress}
				<div
					class={classNames('px-2 sm:px-4 lg:px-8', {
						'2xl:px-0': !isModal
					})}
				>
					<ProgressBar {progress} />
				</div>
			{/if}
		{/snippet}

		{#snippet title_right()}
			<div
				class="flex gap-2 items-center flex-row-reverse justify-end lg:flex-row lg:justify-start"
			>
				{#if jellyfinGetItems().loading || radarrGetMovies().loading}
					<div class="placeholder h-10 w-48 rounded-xl"></div>
				{:else}
					<OpenInButton title={tmdbMovie?.title} {jellyfinItem} type="movie" {tmdbId} />
					{#if isBeingRemoved}
						<Button variant="secondary" disabled>
							<Clock size="20" /><span class="ml-2"
								>{$_('library.content.beingRemoved')}</span
							>
						</Button>
					{:else if jellyfinItem}
						<Button variant="primary" onclick={play}>
							<span>{$_('library.content.play')}</span><ChevronRight size="20" />
						</Button>
						<Button
							variant="error"
							class="px-2!"
							onclick={() => (showRemoveConfirmDialog = true)}
						>
							<Trash size="20" />
						</Button>
					{:else if !radarrMovie && settings.globalSettings.radarr.baseUrl && !isBeingAdded}
						<Select
							disabled={addToRadarrLoading}
							onchange={addToRadarr}
							placeholder={$_('library.content.get')}
							variant="primary"
							showOnlyPlaceholder
						>
							{#each settings.globalSettings.general.downloadLanguages as language}
								<Option value={language} label={$_('languages.' + language)} />
							{/each}
						</Select>
					{:else if radarrMovie}
						<Button variant="secondary" disabled>
							<ActivityLog size="20" /><span class="ml-2"
								>{$_('library.content.queued')}</span
							>
						</Button>
						<Button
							variant="error"
							class="px-2!"
							onclick={() => (showRemoveConfirmDialog = true)}
						>
							<Trash size="20" />
						</Button>
					{:else if isBeingAdded}
						<Button variant="secondary" disabled>
							<Clock size="20" /><span class="ml-2"
								>{$_('library.content.beingAdded')}</span
							>
						</Button>
					{/if}
				{/if}
			</div>
		{/snippet}

		{#snippet info_components()}
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">{$_('library.content.directedBy')}</p>
				<h2 class="font-medium">
					{tmdbMovie?.credits.crew
						?.filter((c) => c.job === 'Director')
						.map((p) => p.name)
						.join(', ')}
				</h2>
			</div>
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">{$_('library.content.releaseDate')}</p>
				<h2 class="font-medium">
					{new Date(tmdbMovie?.release_date || Date.now()).toLocaleDateString(
						settings.userSettings.interface.language,
						{
							year: 'numeric',
							month: 'short',
							day: 'numeric'
						}
					)}
				</h2>
			</div>
			{#if tmdbMovie?.budget}
				<div class="col-span-2 lg:col-span-1">
					<p class="text-zinc-400 text-sm">{$_('library.content.budget')}</p>
					<h2 class="font-medium">
						{tmdbMovie?.budget?.toLocaleString('en-US', {
							style: 'currency',
							currency: 'USD'
						})}
					</h2>
				</div>
			{/if}
			{#if tmdbMovie?.revenue}
				<div class="col-span-2 lg:col-span-1">
					<p class="text-zinc-400 text-sm">{$_('library.content.revenue')}</p>
					<h2 class="font-medium">
						{tmdbMovie?.revenue?.toLocaleString('en-US', {
							style: 'currency',
							currency: 'USD'
						})}
					</h2>
				</div>
			{/if}
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">{$_('library.content.status')}</p>
				<h2 class="font-medium">
					{tmdbMovie?.status}
				</h2>
			</div>
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">{$_('library.content.runtime')}</p>
				<h2 class="font-medium">
					{tmdbMovie?.runtime} Minutes
				</h2>
			</div>
		{/snippet}

		{#snippet servarr_components()}
			{#if radarrMovie}
				{#if radarrMovie?.movieFile?.quality}
					<div class="col-span-2 lg:col-span-1">
						<p class="text-zinc-400 text-sm">Video</p>
						<h2 class="font-medium">
							{radarrMovie?.movieFile?.quality.quality?.type}
						</h2>
					</div>
				{/if}
				{#if radarrMovie?.movieFile?.size}
					<div class="col-span-2 lg:col-span-1">
						<p class="text-zinc-400 text-sm">{$_('library.content.sizeDisk')}</p>
						<h2 class="font-medium">
							{formatSize(radarrMovie?.movieFile?.size || 0)}
						</h2>
					</div>
				{/if}
			{:else if radarrGetMovies().loading}
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
						{#each castProps as prop (prop)}
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
						{#each tmdbRecommendationProps as prop (prop)}
							<Card {...prop} openInModal={isModal} />
						{/each}
					</Carousel>
				{/if}

				{#if tmdbSimilarProps?.length}
					<Carousel gradientFromColor="from-stone-950">
						{#snippet title()}
							<div class="font-medium text-lg">
								{$_('library.content.similarMovies')}
							</div>
						{/snippet}
						{#each tmdbSimilarProps as prop (prop)}
							<Card {...prop} openInModal={isModal} />
						{/each}
					</Carousel>
				{/if}
			{/await}
		{/snippet}
	</TitlePageLayout>
{/if}
{#if showRemoveConfirmDialog}
	<ConfirmDialog
		variant="yesNo"
		confirmMessage={$_('library.content.removeMovieConfirmation')}
		onConfirm={removeMovie}
	/>
{/if}
