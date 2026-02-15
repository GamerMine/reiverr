import type { components } from '$lib/apis/radarr/radarr.generated';
import { getTmdbMovie } from '$lib/apis/tmdb/tmdbApi';
import { settings } from '$lib/stores/settings.svelte';

export type DiskSpaceInfo = components['schemas']['DiskSpaceResource'];
export type RadarrDownload = components['schemas']['QueueResource'] & { movie: RadarrMovie };
export type RadarrMovie = components['schemas']['MovieResource'];
export type RadarrQualityProfileResource = components['schemas']['QualityProfileResource'];
export type RadarrReleaseResource = components['schemas']['ReleaseResource'];
export type RadarrRootFolderResource = components['schemas']['RootFolderResource'];

export interface RadarrMovieOptions {
	title: string;
	qualityProfileId: string;
	minimumAvailability: 'announced' | 'inCinemas' | 'released';
	tags: number[];
	year: number;
	rootFolderPath: string;
	tmdbId: number;
	monitored: boolean;
	addOptions: {
		searchForMovie?: boolean;
	};
}

export const getRadarrMovies = async (): Promise<RadarrMovie[]> => {
	return (
		(await fetch('/api/radarr/movie', {
			method: 'GET'
		}).then(async (res): Promise<RadarrMovie[]> => (await res.json()) || [])) || Promise.resolve([])
	);
};

export const addMovieToRadarr = async (tmdbId: number) => {
	const tmdbMovie = await getTmdbMovie(tmdbId);
	const radarrMovies = await getRadarrMovies();

	if (radarrMovies?.find((v) => v.tmdbId == tmdbId)) throw new Error('Movie already exists');

	if (!tmdbMovie) throw new Error('Movie not found');
	const monitorMovie = settings.globalSettings.radarr.monitor;
	const search = settings.globalSettings.radarr.startSearch;

	const options: RadarrMovieOptions = {
		qualityProfileId: settings.userSettings.radarr.defaultQualityProfileId || '0',
		rootFolderPath: settings.globalSettings.radarr.rootFolderPath || '',
		minimumAvailability: 'announced',
		title: tmdbMovie.title || tmdbMovie.original_title || '',
		tmdbId: tmdbMovie.id || 0,
		year: Number(tmdbMovie.release_date?.slice(0, 4)),
		tags: [],
		monitored: monitorMovie != '0',
		addOptions: {
			searchForMovie: search
		}
	};

	return (
		(await fetch('/api/radarr/movie', {
			method: 'POST',
			body: JSON.stringify(options)
		}).then(async (res) => await res.json())) || Promise.resolve(undefined)
	);
};

export const fetchRadarrReleases = async (movieId: number) => {
	return (
		(await fetch(`/api/radarr/release?movieId=${movieId}`, {
			method: 'GET'
		}).then(async (res): Promise<RadarrReleaseResource> => (await res.json()) || [])) ||
		Promise.resolve([])
	);
};

export const downloadRadarrMovie = async (guid: string, indexerId: number) => {
	return (
		(await fetch('/api/radarr/release', {
			method: 'POST',
			body: JSON.stringify({
				indexerId,
				guid
			})
		}).then((res) => res.ok)) || Promise.resolve(false)
	);
};

export const getRadarrDownloads = async (): Promise<RadarrDownload[]> => {
	return (
		(await fetch('/api/radarr/queue', {
			method: 'GET'
		}).then(
			async (res) =>
				((await res.json()).records?.filter(
					(record: RadarrDownload) => record.movie
				) as RadarrDownload[]) || []
		)) || Promise.resolve([])
	);
};

export const getDiskSpace = async (): Promise<DiskSpaceInfo[]> => {
	return (
		(await fetch('/api/radarr/diskspace', {
			method: 'GET'
		}).then(async (res) => (await res.json()) || [])) || Promise.resolve([])
	);
};

export const getRadarrHealth = async (
	baseUrl: string | undefined = undefined,
	apiKey: string | undefined = undefined
) => {
	let request = `/api/radarr/health`;
	if (baseUrl) {
		request += `?baseUrl=${baseUrl}`;
		if (apiKey) {
			request += `&apiKey=${apiKey}`;
		}
	}

	return await fetch(request, {
		method: 'GET'
	})
		.then((res) => res.status === 200)
		.catch(() => false);
};

export const getRadarrRootFolders = async (
	baseUrl: string | undefined = undefined,
	apiKey: string | undefined = undefined
) => {
	let request = `/api/radarr/rootfolder?baseUrl=${baseUrl}`;
	if (apiKey) {
		request += `&apiKey=${apiKey}`;
	}

	return await fetch(request, {
		method: 'GET'
	}).then(async (res): Promise<RadarrRootFolderResource[]> => (await res.json()) || []);
};

export const getRadarrQualityProfiles = async () => {
	return await fetch('/api/radarr/qualityprofile', {
		method: 'GET'
	}).then(async (res): Promise<RadarrQualityProfileResource[]> => (await res.json()) || []);
};

export function getRadarrPosterUrl(item: RadarrMovie, original = false) {
	const url =
		settings.globalSettings.radarr.baseUrl +
		(item.images?.find((i) => i.coverType === 'poster')?.url || '');

	if (!original) return url.replace('poster.jpg', `poster-${500}.jpg`);

	return url;
}

export const getRadarrMonitors = async () => {
	return ['unknown', 'Movie Only', 'Movie and Collection'];
};
