<script lang="ts">
	import { type JellyfinItem } from '$lib/apis/jellyfin/jellyfinApi';
	import { getPosterProps, TmdbApiOpen } from '$lib/apis/tmdb/tmdbApi';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import GenreCard from '$lib/components/GenreCard.svelte';
	import NetworkCard from '$lib/components/NetworkCard.svelte';
	import PersonCard from '$lib/components/PersonCard/PersonCard.svelte';
	import Poster from '$lib/components/Poster/Poster.svelte';
	import TitleShowcases from '$lib/components/TitleShowcase/TitleShowcasesContainer.svelte';
	import { genres, networks } from '$lib/discover';
	import { jellyfinItemsStore } from '$lib/stores/data.store';
	import { settings } from '$lib/stores/settings.store';
	import type { TitleType } from '$lib/types';
	import { formatDateToYearMonthDay } from '$lib/utils';
	import type { ComponentProps } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { fade } from 'svelte/transition';
	import { tmdbDataFormat } from '$lib/utils.js';

	const jellyfinItemsPromise = new Promise<JellyfinItem[]>((resolve) => {
		jellyfinItemsStore.subscribe((data) => {
			if (data.loading) return;
			resolve(data.data || []);
		});
	});

	const fetchCardProps = async (
		items: {
			name?: string;
			title?: string;
			id?: number;
			vote_average?: number;
			number_of_seasons?: number;
			first_air_date?: string;
			poster_path?: string;
		}[],
		type: TitleType | undefined = undefined
	): Promise<ComponentProps<typeof Poster>[]> => {
		const filtered = $settings.discover.excludeLibraryItems
			? items.filter(
					async (item) =>
						!(await jellyfinItemsPromise).find((i) => i.ProviderIds?.Tmdb === String(item.id))
				)
			: items;

		return Promise.all(filtered.map(async (item) => getPosterProps(item, type))).then((props) =>
			props.filter((p) => p.backdropUrl)
		);
	};

	const fetchTrendingActorProps = () =>
		TmdbApiOpen.GET('/3/trending/person/{time_window}', {
			params: {
				path: {
					time_window: 'week'
				},
				query: {
					language: $settings.language
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then((actors) =>
				actors
					.filter((a) => a.profile_path)
					.map((actor) => ({
						tmdbId: actor.id || 0,
						backdropUri: actor.profile_path || '',
						name: actor.name || '',
						subtitle: actor.known_for_department
							? $_('data.known_for_department.' + tmdbDataFormat(actor.known_for_department))
							: $_('data.unknown')
					}))
			);

	const fetchUpcomingMovies = () =>
		TmdbApiOpen.GET('/3/discover/movie', {
			params: {
				query: {
					'primary_release_date.gte': formatDateToYearMonthDay(new Date()),
					sort_by: 'popularity.desc',
					language: $settings.language,
					region: $settings.discover.region,
					with_original_language: parseIncludedLanguages($settings.discover.includedLanguages)
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then(fetchCardProps);

	const fetchUpcomingSeries = () =>
		TmdbApiOpen.GET('/3/discover/tv', {
			params: {
				query: {
					'first_air_date.gte': formatDateToYearMonthDay(new Date()),
					sort_by: 'popularity.desc',
					language: $settings.language,
					with_original_language: parseIncludedLanguages($settings.discover.includedLanguages)
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then((i) => fetchCardProps(i, 'series'));

	const fetchDigitalReleases = () =>
		TmdbApiOpen.GET('/3/discover/movie', {
			params: {
				query: {
					with_release_type: 4,
					sort_by: 'popularity.desc',
					'release_date.lte': formatDateToYearMonthDay(new Date()),
					language: $settings.language,
					with_original_language: parseIncludedLanguages($settings.discover.includedLanguages)
					// region: $settings.discover.region
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then(fetchCardProps);

	const fetchNowStreaming = () =>
		TmdbApiOpen.GET('/3/discover/tv', {
			params: {
				query: {
					'air_date.gte': formatDateToYearMonthDay(new Date()),
					'first_air_date.lte': formatDateToYearMonthDay(new Date()),
					sort_by: 'popularity.desc',
					language: $settings.language,
					with_original_language: parseIncludedLanguages($settings.discover.includedLanguages)
				}
			}
		})
			.then((res) => res.data?.results || [])
			.then((i) => fetchCardProps(i, 'series'));

	function parseIncludedLanguages(includedLanguages: string) {
		return includedLanguages.replace(' ', '').split(',').join('|');
	}

	const PADDING = 'px-4 lg:px-8 2xl:px-16';
</script>

<TitleShowcases />

<div
	class="flex flex-col gap-12 py-6 bg-stone-950"
	in:fade|global={{
		duration: $settings.animationDuration,
		delay: $settings.animationDuration
	}}
	out:fade|global={{ duration: $settings.animationDuration }}
>
	<Carousel scrollClass={PADDING}>
		{#snippet title()}
			<div class="text-lg font-semibold text-zinc-300">
				{$_('discover.popularPeople')}
			</div>
		{/snippet}
		{#await fetchTrendingActorProps()}
			<!--TODO: CarouselPlaceholderItems should not be created like that, add an animation to show that it is loading-->
			<!--<CarouselPlaceholderItems />-->
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<PersonCard {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel scrollClass={PADDING}>
		{#snippet title()}
			<div class="text-lg font-semibold text-zinc-300">
				{$_('discover.upcomingMovies')}
			</div>
		{/snippet}
		{#await fetchUpcomingMovies()}
			<!--<CarouselPlaceholderItems />-->
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<Poster {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel scrollClass={PADDING}>
		{#snippet title()}
			<div class="text-lg font-semibold text-zinc-300">
				{$_('discover.upcomingSeries')}
			</div>
		{/snippet}
		{#await fetchUpcomingSeries()}
			<!--<CarouselPlaceholderItems />-->
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<Poster {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel scrollClass={PADDING}>
		{#snippet title()}
			<div class="text-lg font-semibold text-zinc-300">
				{$_('discover.genres')}
			</div>
		{/snippet}
		{#each Object.values(genres) as genre (genre.tmdbGenreId)}
			<GenreCard {genre} />
		{/each}
	</Carousel>
	<Carousel scrollClass={PADDING}>
		{#snippet title()}
			<div class="text-lg font-semibold text-zinc-300">
				{$_('discover.newDigitalReleases')}
			</div>
		{/snippet}
		{#await fetchDigitalReleases()}
			<!--<CarouselPlaceholderItems />-->
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<Poster {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel scrollClass={PADDING}>
		{#snippet title()}
			<div class="text-lg font-semibold text-zinc-300">
				{$_('discover.streamingNow')}
			</div>
		{/snippet}
		{#await fetchNowStreaming()}
			<!--<CarouselPlaceholderItems />-->
		{:then props}
			{#each props as prop (prop.tmdbId)}
				<Poster {...prop} />
			{/each}
		{/await}
	</Carousel>
	<Carousel scrollClass={PADDING}>
		{#snippet title()}
			<div class="text-lg font-semibold text-zinc-300">
				{$_('discover.TVNetworks')}
			</div>
		{/snippet}
		{#each Object.values(networks) as network (network.tmdbNetworkId)}
			<NetworkCard {network} />
		{/each}
	</Carousel>
</div>
