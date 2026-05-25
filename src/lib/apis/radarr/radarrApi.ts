import type { components } from '$lib/apis/radarr/radarr.generated';
import { settings } from '$lib/stores/settings.svelte';

export type DiskSpaceInfo = components['schemas']['DiskSpaceResource'];
export type RadarrDownload = components['schemas']['QueueResource'] & { movie: RadarrMovie };
export type RadarrMovie = components['schemas']['MovieResource'];
export type RadarrQualityProfileResource = components['schemas']['QualityProfileResource'];
export type RadarrReleaseResource = components['schemas']['ReleaseResource'];
export type RadarrRootFolderResource = components['schemas']['RootFolderResource'];

export interface RadarrMovieOptions {
	qualityProfileId: string;
	rootFolderPath: string;
	tmdbId: number;
	monitored: boolean;
}

export const getRadarrMovies = async (): Promise<RadarrMovie[]> => {
	return (
		(await fetch('/api/radarr/movie', {
			method: 'GET'
		}).then(async (res): Promise<RadarrMovie[]> => (await res.json()) || [])) ||
		Promise.resolve([])
	);
};

/*export const addMovieToRadarr = async (tmdbId: number) => {
	const radarrMovies = await getRadarrMovies();

	if (radarrMovies?.find((v) => v.tmdbId == tmdbId)) throw new Error('Movie already exists');

	const options: RadarrMovieOptions = {
		qualityProfileId: '1',
		rootFolderPath: settings.globalSettings.radarr.rootFolderPath || '',
		tmdbId: tmdbId,
		monitored: false,
	};

	return (
		(await fetch('/api/radarr/movie', {
			method: 'POST',
			body: JSON.stringify(options)
		}).then(async (res) => await res.json())) || Promise.resolve(undefined)
	);
};*/

export const fetchRadarrReleases = async (movieId: number) => {
	return (
		(await fetch(`/api/radarr/release?movieId=${movieId}`, {
			method: 'GET'
		}).then(async (res): Promise<RadarrReleaseResource[]> => (await res.json()) || [])) ||
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

export const removeMovieFromRadarr = async (id: number, deleteFiles: boolean = false) => {
	const request = `/api/radarr/movie?movieId=${id}&deleteFiles=${deleteFiles}`;
	return (
		(await fetch(request, {
			method: 'DELETE'
		}).then(async (res) => await res.json())) || Promise.resolve(undefined)
	);
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
