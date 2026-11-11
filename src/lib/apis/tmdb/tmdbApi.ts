import { browser } from '$app/env';
import { TMDB_API_KEY, TMDB_BACKDROP_SMALL } from '#lib/utils/constants.ts';
import createClient from 'openapi-fetch';
import type { operations, paths } from './tmdb.generated';
import type { TitleType } from '#lib/utils/types.ts';
import { settings } from '#lib/stores/settings.svelte.js';

const CACHE_ONE_DAY = 'max-age=86400';

export type TmdbMovie2 =
	operations['movie-details']['responses']['200']['content']['application/json'];
export type TmdbSeries2 =
	operations['tv-series-details']['responses']['200']['content']['application/json'];
export type TmdbSeason =
	operations['tv-season-details']['responses']['200']['content']['application/json'];
export type TmdbPerson =
	operations['person-details']['responses']['200']['content']['application/json'];

export interface TmdbPersonFull extends TmdbPerson {
	images: operations['person-images']['responses']['200']['content']['application/json'];
	movie_credits: operations['person-tv-credits']['responses']['200']['content']['application/json'];
	tv_credits: operations['person-movie-credits']['responses']['200']['content']['application/json'];
	external_ids: operations['person-external-ids']['responses']['200']['content']['application/json'];
}

export interface TmdbMovieFull2 extends TmdbMovie2 {
	videos: operations['movie-videos']['responses']['200']['content']['application/json'];
	credits: operations['movie-credits']['responses']['200']['content']['application/json'];
	external_ids: operations['movie-external-ids']['responses']['200']['content']['application/json'];
	images: operations['movie-images']['responses']['200']['content']['application/json'];
}

export interface TmdbSeriesFull2 extends TmdbSeries2 {
	videos: operations['tv-series-videos']['responses']['200']['content']['application/json'];
	aggregate_credits: operations['tv-series-aggregate-credits']['responses']['200']['content']['application/json'];
	external_ids: operations['tv-series-external-ids']['responses']['200']['content']['application/json'];
	images: operations['tv-series-images']['responses']['200']['content']['application/json'];
}

const backdropCache = browser ? window?.caches?.open('backdrops') : undefined;

const getTmdbCache = async (
	cachePromise: typeof backdropCache,
	tmdbId: number,
	fn: () => Promise<string | undefined>
) => {
	const cache = await cachePromise;

	if (cache) {
		const cacheRes = await cache.match(String(tmdbId));
		if (cacheRes) return cacheRes.text();
		else {
			const backdropUri = await fn();
			if (backdropUri) {
				cache.put(String(tmdbId), new Response(backdropUri));
			}
			return backdropUri;
		}
	} else {
		return fn();
	}
};

export const TmdbApiOpen = createClient<paths>({
	baseUrl: 'https://api.themoviedb.org',
	headers: {
		Authorization: `Bearer ${TMDB_API_KEY}`
	}
});

const FALLBACK_LANGUAGE = 'en-US';
const isMissing = (v: unknown) => typeof v !== 'string' || !v.trim();

/** Fetch in the user's language, then fill empty `keys` from en-US when TMDB has no translation. */
async function withLanguageFallback<T extends object>(
	fetcher: (language: string) => Promise<T | undefined>,
	keys: string[]
): Promise<T | undefined> {
	const language = settings.userSettings.interface.language;
	const localized = await fetcher(language);
	if (!localized || language === FALLBACK_LANGUAGE) return localized;
	const record = localized as Record<string, unknown>;
	if (!keys.some((k) => isMissing(record[k]))) return localized;

	const fallback = (await fetcher(FALLBACK_LANGUAGE)) as Record<string, unknown> | undefined;
	if (!fallback) return localized;
	const merged: Record<string, unknown> = { ...record };
	for (const k of keys) {
		if (isMissing(merged[k]) && !isMissing(fallback[k])) merged[k] = fallback[k];
	}
	return merged as T;
}

export const getTmdbMovie = async (tmdbId: number) =>
	withLanguageFallback<TmdbMovieFull2>(
		(language) => fetchTmdbMovie(tmdbId, language),
		['title', 'overview', 'tagline']
	);

const fetchTmdbMovie = async (tmdbId: number, language: string) =>
	await TmdbApiOpen.GET('/3/movie/{movie_id}', {
		params: {
			path: {
				movie_id: tmdbId
			},
			query: {
				language,
				append_to_response: 'videos,credits,external_ids,images',
				...({
					include_image_language: settings.userSettings.interface.language + ',en,null'
				} as any)
			}
		}
	}).then((res) => res.data as TmdbMovieFull2 | undefined);

export const getTmdbSeries = async (tmdbId: number): Promise<TmdbSeriesFull2 | undefined> =>
	withLanguageFallback<TmdbSeriesFull2>(
		(language) => fetchTmdbSeries(tmdbId, language),
		['name', 'overview', 'tagline']
	);

const fetchTmdbSeries = async (
	tmdbId: number,
	language: string
): Promise<TmdbSeriesFull2 | undefined> =>
	await TmdbApiOpen.GET('/3/tv/{series_id}', {
		params: {
			path: {
				series_id: tmdbId
			},
			query: {
				language,
				append_to_response: 'videos,aggregate_credits,external_ids,images',
				...({
					include_image_language: settings.userSettings.interface.language + ',en,null'
				} as any)
			}
		},
		headers: {
			'Cache-Control': CACHE_ONE_DAY
		}
	}).then((res) => res.data as TmdbSeriesFull2 | undefined);

const fetchTmdbSeason = (tmdbId: number, season: number, language: string) =>
	TmdbApiOpen.GET('/3/tv/{series_id}/season/{season_number}', {
		params: {
			path: {
				series_id: tmdbId,
				season_number: season
			},
			query: { language }
		}
	}).then((res) => res.data);

export const getTmdbSeriesSeason = async (
	tmdbId: number,
	season: number
): Promise<TmdbSeason | undefined> => {
	const language = settings.userSettings.interface.language;
	const localized = await fetchTmdbSeason(tmdbId, season, language);
	if (!localized || language === FALLBACK_LANGUAGE) return localized;

	// TMDB returns empty fields when a translation is missing: fall back to en-US.
	if (!localized.episodes?.some((e) => isMissing(e.name) || isMissing(e.overview)))
		return localized;

	const fallback = await fetchTmdbSeason(tmdbId, season, FALLBACK_LANGUAGE);
	if (!fallback) return localized;

	return {
		...localized,
		overview: isMissing(localized.overview) ? fallback.overview : localized.overview,
		episodes: localized.episodes?.map((e) => {
			const fb = fallback.episodes?.find((f) => f.episode_number === e.episode_number);
			return {
				...e,
				name: isMissing(e.name) ? (fb?.name ?? e.name) : e.name,
				overview: isMissing(e.overview) ? (fb?.overview ?? e.overview) : e.overview
			};
		})
	};
};

export const getTmdbSeriesSeasons = (tmdbId: number, seasons: number) =>
	[...Array(seasons).keys()].map((i) => getTmdbSeriesSeason(tmdbId, i + 1));
export const getTmdbSeriesBackdrop = async (tmdbId: number) =>
	getTmdbCache(backdropCache, tmdbId, () =>
		getTmdbSeries(tmdbId)
			.then((s) => s?.images)
			.then(
				(r) =>
					(
						r?.backdrops?.find(
							(b) => b.iso_639_1 === settings.userSettings.interface.language
						) ||
						r?.backdrops?.find((b) => b.iso_639_1 === 'en') ||
						r?.backdrops?.find((b) => b.iso_639_1) ||
						r?.backdrops?.[0]
					)?.file_path
			)
	);
export const getTmdbMovieBackdrop = async (tmdbId: number) =>
	getTmdbCache(backdropCache, tmdbId, () =>
		getTmdbMovie(tmdbId)
			.then((m) => m?.images)
			.then(
				(r) =>
					(
						r?.backdrops?.find(
							(b) => b.iso_639_1 === settings.userSettings.interface.language
						) ||
						r?.backdrops?.find((b) => b.iso_639_1 === 'en') ||
						r?.backdrops?.find((b) => b.iso_639_1) ||
						r?.backdrops?.[0]
					)?.file_path
			)
	);

/** Discover */

export const getTmdbPopularMovies = () =>
	TmdbApiOpen.GET('/3/movie/popular', {
		params: {
			query: {
				language: settings.userSettings.interface.language,
				region: settings.userSettings.discover.region
			}
		}
	}).then((res) => res.data?.results || []);

export const getTmdbSeriesRecommendations = (tmdbId: number) =>
	TmdbApiOpen.GET('/3/tv/{series_id}/recommendations', {
		params: { path: { series_id: tmdbId } }
	}).then((res) => res.data?.results || []);
export const getTmdbSeriesSimilar = (tmdbId: number) =>
	TmdbApiOpen.GET('/3/tv/{series_id}/similar', {
		params: { path: { series_id: String(tmdbId) } }
	}).then((res) => res.data?.results || []);
export const getTmdbMovieRecommendations = (tmdbId: number) =>
	TmdbApiOpen.GET('/3/movie/{movie_id}/recommendations', {
		params: { path: { movie_id: tmdbId } }
	}).then((res): TmdbMovie2[] => res.data?.results || []);
export const getTmdbMovieSimilar = (tmdbId: number) =>
	TmdbApiOpen.GET('/3/movie/{movie_id}/similar', { params: { path: { movie_id: tmdbId } } }).then(
		(res) => res.data?.results || []
	);
export const searchTmdbTitles = (query: string) =>
	TmdbApiOpen.GET('/3/search/multi', { params: { query: { query } } }).then(
		(res) => res.data?.results || []
	);

export const getPosterProps = async (
	item: {
		name?: string;
		title?: string;
		id?: number;
		vote_average?: number;
		number_of_seasons?: number;
		first_air_date?: string;
		poster_path?: string;
	},
	type: TitleType | undefined = undefined
) => {
	const backdropUri = item.poster_path;
	const t =
		type ||
		(item?.number_of_seasons === undefined && item?.first_air_date === undefined
			? 'movie'
			: 'tv');
	return {
		tmdbId: item.id || 0,
		title: item.title || item.name || '',
		// subtitle: item.subtitle || '',
		rating: item.vote_average || undefined,
		size: 'md',
		backdropUrl: backdropUri ? TMDB_BACKDROP_SMALL + backdropUri : '',
		type: t,
		orientation: 'portrait'
	} as const;
};

export const getTmdbPerson = async (person_id: number) =>
	withLanguageFallback<TmdbPersonFull>(
		(language) => fetchTmdbPerson(person_id, language),
		['biography']
	);

const fetchTmdbPerson = async (person_id: number, language: string) =>
	TmdbApiOpen.GET('/3/person/{person_id}', {
		params: {
			path: { person_id },
			query: {
				language,
				append_to_response: 'images,movie_credits,tv_credits,external_ids'
			}
		}
	}).then((res) => res.data as TmdbPersonFull);

export const TMDB_MOVIE_GENRES = [
	{
		id: 28,
		name: 'Action'
	},
	{
		id: 12,
		name: 'Adventure'
	},
	{
		id: 16,
		name: 'Animation'
	},
	{
		id: 35,
		name: 'Comedy'
	},
	{
		id: 80,
		name: 'Crime'
	},
	{
		id: 99,
		name: 'Documentary'
	},
	{
		id: 18,
		name: 'Drama'
	},
	{
		id: 10751,
		name: 'Family'
	},
	{
		id: 14,
		name: 'Fantasy'
	},
	{
		id: 36,
		name: 'History'
	},
	{
		id: 27,
		name: 'Horror'
	},
	{
		id: 10402,
		name: 'Music'
	},
	{
		id: 9648,
		name: 'Mystery'
	},
	{
		id: 10749,
		name: 'Romance'
	},
	{
		id: 878,
		name: 'Science Fiction'
	},
	{
		id: 10770,
		name: 'TV Movie'
	},
	{
		id: 53,
		name: 'Thriller'
	},
	{
		id: 10752,
		name: 'War'
	},
	{
		id: 37,
		name: 'Western'
	}
];

export const TMDB_SERIES_GENRES = [
	{
		id: 10759,
		name: 'Action & Adventure'
	},
	{
		id: 16,
		name: 'Animation'
	},
	{
		id: 35,
		name: 'Comedy'
	},
	{
		id: 80,
		name: 'Crime'
	},
	{
		id: 99,
		name: 'Documentary'
	},
	{
		id: 18,
		name: 'Drama'
	},
	{
		id: 10751,
		name: 'Family'
	},
	{
		id: 10762,
		name: 'Kids'
	},
	{
		id: 9648,
		name: 'Mystery'
	},
	{
		id: 10763,
		name: 'News'
	},
	{
		id: 10764,
		name: 'Reality'
	},
	{
		id: 10765,
		name: 'Sci-Fi & Fantasy'
	},
	{
		id: 10766,
		name: 'Soap'
	},
	{
		id: 10767,
		name: 'Talk'
	},
	{
		id: 10768,
		name: 'War & Politics'
	},
	{
		id: 37,
		name: 'Western'
	}
];
