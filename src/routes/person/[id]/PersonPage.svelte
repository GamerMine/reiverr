<script lang="ts">
	import { getTmdbPerson } from '$lib/apis/tmdb/tmdbApi';
	import Carousel from '$lib/components/Carousel/Carousel.svelte';
	import Poster from '$lib/components/Poster/Poster.svelte';
	import TitlePageLayout from '$lib/components/TitlePageLayout/TitlePageLayout.svelte';
	import FacebookIcon from '$lib/components/svgs/FacebookIcon.svelte';
	import ImdbIcon from '$lib/components/svgs/ImdbIcon.svelte';
	import TiktokIcon from '$lib/components/svgs/TiktokIcon.svelte';
	import TmdbIcon from '$lib/components/svgs/TmdbIcon.svelte';
	import TwitterIcon from '$lib/components/svgs/TwitterIcon.svelte';
	import YoutubeIcon from '$lib/components/svgs/YoutubeIcon.svelte';
	import { TMDB_POSTER_SMALL } from '$lib/constants';
	import { DotFilled, InstagramLogo } from 'svelte-radix';
	import { _ } from 'svelte-i18n';
	import { settings } from '$lib/stores/settings.store';
	import { tmdbDataFormat } from '$lib/utils.js';

	const GENDER_OPTIONS = [
		$_('library.personPage.notSet'),
		$_('library.personPage.female'),
		$_('library.personPage.male'),
		$_('library.personPage.nonBinary')
	] as const;

	let {
		tmdbId,
		isModal = false,
		handleCloseModal = () => {}
	}: {
		tmdbId: number;
		isModal?: boolean;
		handleCloseModal?: () => void;
	} = $props();

	const tmdbUrl = 'https://www.themoviedb.org/person/' + tmdbId;
	const data = loadInitialPageData();

	async function loadInitialPageData() {
		const tmdbPerson = await getTmdbPerson(tmdbId);

		const tmdbSocials = [];

		tmdbSocials.push({
			url: `https://themoviedb.org/person/${tmdbPerson.id}`,
			icon: TmdbIcon
		});

		for (const [social, id] of Object.entries(tmdbPerson.external_ids)) {
			if (Boolean(id)) {
				switch (social) {
					case 'facebook_id':
						tmdbSocials.push({
							url: `https://facebook.com/${id}`,
							icon: FacebookIcon
						});
						break;
					case 'imdb_id':
						tmdbSocials.push({
							url: `https://imdb.com/name/${id}`,
							icon: ImdbIcon
						});
						break;
					case 'twitter_id':
						tmdbSocials.push({
							url: `https://x.com/${id}`,
							icon: TwitterIcon
						});
						break;
					case 'youtube_id':
						tmdbSocials.push({
							url: `https://youtube.com/@${id}`,
							icon: YoutubeIcon
						});
						break;
					case 'instagram_id':
						tmdbSocials.push({
							url: `https://instagram.com/${id}`,
							icon: InstagramLogo
						});
						break;
					case 'tiktok_id':
						tmdbSocials.push({
							url: `https://www.tiktok.com/@${id}`,
							icon: TiktokIcon
						});
						break;
				}
			}
		}

		const isDirector = tmdbPerson.known_for_department == 'Directing';

		const knownForMovies = tmdbPerson.movie_credits[isDirector ? 'crew' : 'cast']?.filter(
			(value, index, self) => index === self.findIndex((t) => t.id === value.id)
		);
		const knownForSeries = tmdbPerson.tv_credits[isDirector ? 'crew' : 'cast']?.filter(
			(value, index, self) => index === self.findIndex((t) => t.id === value.id)
		);

		let knownForProps = [...(knownForMovies ?? []), ...(knownForSeries ?? [])]
			.sort(
				(a: any, b: any) =>
					new Date(b.first_air_date || b.release_date || 0).getTime() -
					new Date(a.first_air_date || a.release_date || 0).getTime()
			)
			.map((i) => ({
				tmdbId: i.id,
				title: (i as any).title ?? (i as any).name ?? '',
				subtitle: (i as any).job ?? (i as any).character ?? '',
				backdropUrl: i.poster_path ? TMDB_POSTER_SMALL + i.poster_path : ''
			}))
			.filter((i) => i.backdropUrl);

		const movieCredits =
			tmdbPerson.movie_credits.cast?.filter(
				(value, index, self) => index === self.findIndex((t) => t.id === value.id)
			).length || 0;
		const seriesCredits =
			tmdbPerson.tv_credits.cast?.filter(
				(value, index, self) => index === self.findIndex((t) => t.id === value.id)
			).length || 0;
		const crewCredits =
			tmdbPerson.movie_credits.crew?.filter(
				(value, index, self) => index === self.findIndex((t) => t.id === value.id)
			).length || 0;

		return {
			tmdbPerson,
			tmdbSocials,
			knownForProps,
			movieCredits,
			seriesCredits,
			crewCredits
		};
	}
</script>

<!-- TODO: When no data are available, show the that no data has been found on TMDB -->
{#await data}
	<TitlePageLayout {isModal} {handleCloseModal} />
{:then { tmdbPerson, tmdbSocials, knownForProps, movieCredits, seriesCredits, crewCredits }}
	{@const person = tmdbPerson}
	<TitlePageLayout
		titleInformation={{
			tmdbId: Number(person?.id),
			type: 'person',
			title: person?.name || 'Person',
			backdropUriCandidates: [person?.profile_path ?? ''],
			posterPath: person?.profile_path || '',
			tagline: person?.known_for_department
				? $_('data.known_for_department.' + tmdbDataFormat(person?.known_for_department))
				: person?.name || '',
			overview: person?.biography || ''
		}}
		{isModal}
		{handleCloseModal}
	>
		{#snippet title_info()}
			{#if person?.homepage}
				<a href={person?.homepage} target="_blank">{$_('library.personPage.homepage')}</a>
				<DotFilled />
			{/if}
			{#if movieCredits + seriesCredits + crewCredits > 0}
				<p>{movieCredits + seriesCredits + crewCredits} Credits</p>
			{/if}
		{/snippet}
		{#snippet title_right()}{/snippet}

		{#snippet info_components()}
			{#if tmdbSocials}
				<div class="col-span-2 lg:col-span-1">
					<p class="text-zinc-400 text-sm">{$_('library.personPage.externalLinks')}</p>
					<h2 class="pt-2 text-sm">
						<div class="flex flex-wrap gap-2">
							{#each tmdbSocials ?? [] as Prop}
								<a href={Prop.url} target="_blank">
									<Prop.icon class="h-6 w-6 shrink-0 text-white" />
								</a>
							{/each}
						</div>
					</h2>
				</div>
			{/if}
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">{$_('library.personPage.knownFor')}</p>
				<h2 class="font-medium">
					{person?.known_for_department
						? $_('data.known_for_department.' + tmdbDataFormat(person?.known_for_department))
						: $_('data.unknown')}
				</h2>
			</div>
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">{$_('library.personPage.gender')}</p>
				<h2 class="font-medium">
					{GENDER_OPTIONS[person?.gender ?? 0]}
				</h2>
			</div>
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">{$_('library.personPage.birthday')}</p>
				<h2 class="font-medium">
					{new Date(person?.birthday || Date.now()).toLocaleDateString($settings.language, {
						year: 'numeric',
						month: 'short',
						day: 'numeric'
					})}
				</h2>
			</div>
			<div class="col-span-2 lg:col-span-1">
				<p class="text-zinc-400 text-sm">{$_('library.personPage.placeOfBirth')}</p>
				<h2 class="font-medium">
					{person?.place_of_birth}
				</h2>
			</div>
			<!-- TODO: Truncate and add show all button -->
			<!-- {#if person?.also_known_as}
				<div class="col-span-2 lg:col-span-1">
					<p class="text-zinc-400 text-sm">Also known as</p>
					<h2 class="font-medium">
						{#each person?.also_known_as ?? [] as prop}
							<p>{prop}</p>
						{/each}
					</h2>
				</div>
			{/if} -->
		{/snippet}

		{#snippet carousels()}
			<div class="max-w-screen-2xl 2xl:mx-auto w-full">
				<Carousel gradientFromColor="from-stone-950">
					{#snippet title()}
						<div class="font-medium text-lg">{$_('library.personPage.knownFor')}</div>
					{/snippet}
					{#each knownForProps as prop}
						<Poster orientation="portrait" {...prop} openInModal={isModal} />
					{/each}
				</Carousel>
			</div>
		{/snippet}

		{#snippet servarr_components()}{/snippet}
	</TitlePageLayout>
{/await}
