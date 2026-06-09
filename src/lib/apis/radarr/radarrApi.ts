import type { components } from '$lib/apis/radarr/radarr.generated';
import { settings } from '$lib/stores/settings.svelte.js';

export type DiskSpaceInfo = components['schemas']['DiskSpaceResource'];
export type RadarrDownload = components['schemas']['QueueResource'] & { movie: RadarrMovie };
export type RadarrMovie = components['schemas']['MovieResource'];
export type RadarrReleaseResource = components['schemas']['ReleaseResource'];

export const getRadarrMovies = async (): Promise<RadarrMovie[]> => {
	return (
		(await fetch('/api/radarr/movie', {
			method: 'GET'
		}).then(async (res): Promise<RadarrMovie[]> => (await res.json()) || [])) ||
		Promise.resolve([])
	);
};

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

export const removeMovieFromRadarr = async (id: number, deleteFiles: boolean = false) => {
	const request = `/api/radarr/movie?movieId=${id}&deleteFiles=${deleteFiles}`;
	return (
		(await fetch(request, {
			method: 'DELETE'
		}).then(async (res) => await res.json())) || Promise.resolve(undefined)
	);
};

export function getRadarrPosterUrl(item: RadarrMovie, original = false) {
	const url =
		settings.globalSettings.radarr.baseUrl +
		(item.images?.find((i) => i.coverType === 'poster')?.url || '');

	if (!original) return url.replace('poster.jpg', `poster-${500}.jpg`);

	return url;
}
