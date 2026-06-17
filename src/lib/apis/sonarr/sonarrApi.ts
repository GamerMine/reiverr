import type { components } from '$lib/apis/sonarr/sonarr.generated';
import { settings } from '$lib/stores/settings.svelte.js';

export type SonarrSeries = components['schemas']['SeriesResource'];
export type SonarrReleaseResource = components['schemas']['ReleaseResource'];
export type DiskSpaceInfo = components['schemas']['DiskSpaceResource'];

export const getSonarrSeries = async (): Promise<SonarrSeries[]> => {
	return (
		(await fetch('/api/sonarr/series', {
			method: 'GET'
		}).then(async (res): Promise<SonarrSeries[]> => (await res.json()) || [])) ||
		Promise.resolve([])
	);
};

export const getDiskSpace = async (): Promise<DiskSpaceInfo[]> => {
	return (
		(await fetch('/api/sonarr/diskspace', {
			method: 'GET'
		}).then(async (res): Promise<DiskSpaceInfo[]> => (await res.json()) || [])) ||
		Promise.resolve([])
	);
};

export const downloadSonarrEpisode = async (guid: string, indexerId: number) => {
	return (
		(await fetch('/api/sonarr/release', {
			method: 'POST',
			body: JSON.stringify({
				indexerId,
				guid
			})
		}).then((res) => res.ok)) || Promise.resolve(false)
	);
};

export const fetchSonarrReleases = async (episodeId: number): Promise<SonarrReleaseResource[]> => {
	return (
		(await fetch(`/api/sonarr/release?episodeId=${episodeId}`, {
			method: 'GET'
		}).then(async (res): Promise<SonarrReleaseResource[]> => (await res.json()) || [])) ||
		Promise.resolve([])
	);
};

export const fetchSonarrSeasonReleases = async (
	seriesId: number,
	seasonNumber: number
): Promise<SonarrReleaseResource[]> => {
	return (
		(await fetch(`/api/sonarr/release?seriesId=${seriesId}&seasonNumber=${seasonNumber}`, {
			method: 'GET'
		}).then(async (res): Promise<SonarrReleaseResource[]> => (await res.json()) || [])) ||
		Promise.resolve([])
	);
};

export function getSonarrPosterUrl(item: SonarrSeries, original = false) {
	const url =
		settings.globalSettings.sonarr.baseUrl +
		(item.images?.find((i) => i.coverType === 'poster')?.url || '');

	if (!original) return url.replace('poster.jpg', `poster-${500}.jpg`);

	return url;
}
