import type { components } from '$lib/apis/sonarr/sonarr.generated';
import { getTmdbSeries } from '$lib/apis/tmdb/tmdbApi';
import { settings } from '$lib/stores/settings.svelte.js';

export type SonarrSeries = components['schemas']['SeriesResource'];
export type SonarrReleaseResource = components['schemas']['ReleaseResource'];
export type SonarrDownload = components['schemas']['QueueResource'] & { series: SonarrSeries };
export type DiskSpaceInfo = components['schemas']['DiskSpaceResource'];
export type SonarrEpisode = components['schemas']['EpisodeResource'];

export interface SonarrSeriesOptions {
	title: string;
	seasonFolder: boolean;
	monitored: boolean;
	tvdbId: number;
	rootFolderPath: string;
	addOptions: {
		monitor:
			| 'unknown'
			| 'all'
			| 'future'
			| 'missing'
			| 'existing'
			| 'firstSeason'
			| 'latestSeason'
			| 'pilot'
			| 'monitorSpecials'
			| 'unmonitorSpecials'
			| 'none';
		searchForMissingEpisodes: boolean;
		searchForCutoffUnmetEpisodes: boolean;
	};
}

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

export const addSeriesToSonarr = async (tmdbId: number) => {
	const tmdbSeries = await getTmdbSeries(tmdbId);

	if (!tmdbSeries || !tmdbSeries.external_ids.tvdb_id || !tmdbSeries.name)
		throw new Error('TV show not found');

	const monitorType = settings.globalSettings.sonarr.monitor;
	const search = settings.globalSettings.sonarr.startSearch;
	const options: SonarrSeriesOptions = {
		title: tmdbSeries.name,
		tvdbId: tmdbSeries.external_ids.tvdb_id,
		monitored: monitorType != 'none',
		addOptions: {
			monitor: monitorType ? (monitorType as any) : 'none',
			searchForMissingEpisodes: search ? search : false,
			searchForCutoffUnmetEpisodes: search ? search : false
		},
		rootFolderPath: settings.globalSettings.sonarr.rootFolderPath || '',
		seasonFolder: true
	};

	return await fetch('/api/sonarr/series', {
		method: 'POST',
		body: JSON.stringify(options)
	}).then(async (res) => await res.json());
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

export const getSonarrDownloads = async (): Promise<SonarrDownload[]> => {
	return (
		(await fetch('/api/sonarr/queue', {
			method: 'GET'
		}).then(
			async (res) =>
				((await res.json()).records?.filter(
					(record: SonarrDownload) => record.episode && record.series
				) as SonarrDownload[]) || []
		)) || Promise.resolve([])
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

export const fetchSonarrEpisodes = async (seriesId: number): Promise<SonarrEpisode[]> => {
	return (
		(await fetch(`/api/sonarr/episode?seriesId=${seriesId}`, {
			method: 'GET'
		}).then(async (res) => (await res.json()) || [])) || Promise.resolve([])
	);
};

export function getSonarrPosterUrl(item: SonarrSeries, original = false) {
	const url =
		settings.globalSettings.sonarr.baseUrl +
		(item.images?.find((i) => i.coverType === 'poster')?.url || '');

	if (!original) return url.replace('poster.jpg', `poster-${500}.jpg`);

	return url;
}
