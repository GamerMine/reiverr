import type { components } from '$lib/apis/jellyfin/jellyfin.generated';
import type { DeviceProfile } from '$lib/apis/jellyfin/playback-profiles';
import { settings } from '$lib/stores/settings.store';
import { get } from 'svelte/store';
import { arrayToQuery } from '$lib/utils';

export type JellyfinItem = components['schemas']['BaseItemDto'];

export const getJellyfinContinueWatching = async (): Promise<JellyfinItem[] | undefined> =>
	await fetch('/api/jellyfin/userItems/resume', {
		method: 'GET'
	}).then(async (res) => (await res.json())?.Items || []);

export const getJellyfinNextUp = async () =>
	await fetch('/api/jellyfin/shows/nextUp', {
		method: 'GET'
	}).then(async (res) => (await res.json())?.Items || []);

export const getJellyfinItems = async () =>
	(await fetch(
		`/api/jellyfin/items?${arrayToQuery('includeItemTypes', ['Movie', 'Series'])}&hasTmdbId=true&${arrayToQuery('fields', ['ProviderIds', 'Genres', 'DateLastMediaAdded', 'DateCreated'])}`,
		{
			method: 'GET'
		}
	).then(async (res) => (await res.json()).Items || [])) || Promise.resolve([]);

export const getJellyfinEpisodes = async (parentId = '') =>
	await fetch(
		`/api/jellyfin/items?${arrayToQuery('includeItemTypes', ['Episode'])}&parentId=${parentId}`,
		{
			method: 'GET'
		}
	).then(async (res) => (await res.json())?.Items || []);

export const getJellyfinItem = async (itemId: string) =>
	await fetch(`/api/jellyfin/items/item?itemId=${itemId}`, {
		method: 'GET'
	}).then(async (res) => await res.json());

export const getJellyfinPlaybackInfo = async (
	itemId: string,
	playbackProfile: DeviceProfile,
	startTimeTicks = 0,
	maxStreamingBitrate = 140000000
) =>
	await fetch(
		`/api/jellyfin/items/playbackInfo?itemId=${itemId}&startTimeTicks=${startTimeTicks}&maxStreamingBitrate=${maxStreamingBitrate}`,
		{
			method: 'POST',
			body: JSON.stringify({ playbackProfile }),
			headers: {
				'Content-Type': 'application/json'
			}
		}
	).then(async (res) => {
		const data = await res.json();

		return {
			playbackUri:
				data?.MediaSources?.[0]?.TranscodingUrl ||
				`/Videos/${data?.MediaSources?.[0].Id}/stream.mp4?Static=true&mediaSourceId=${
					data?.MediaSources?.[0].Id
				}&Tag=${data?.MediaSources?.[0].ETag}`,
			mediaSourceId: data?.MediaSources?.[0]?.Id,
			playSessionId: data?.PlaySessionId,
			directPlay:
				!!data?.MediaSources?.[0]?.SupportsDirectPlay ||
				!!data?.MediaSources?.[0]?.SupportsDirectStream
		};
	});

export const reportJellyfinPlaybackStarted = async (
	itemId: string,
	sessionId: string,
	mediaSourceId: string,
	audioStreamIndex?: number,
	subtitleStreamIndex?: number
) =>
	await fetch('/api/jellyfin/sessions/playing', {
		method: 'POST',
		body: JSON.stringify({
			ItemId: itemId,
			PlaySessionId: sessionId,
			MediaSourceId: mediaSourceId,
			AudioStreamIndex: 1,
			SubtitleStreamIndex: -1
		}),
		headers: {
			'Content-Type': 'application/json'
		}
	});

export const reportJellyfinPlaybackProgress = async (
	itemId: string,
	sessionId: string,
	isPaused: boolean,
	positionTicks: number
) =>
	await fetch('/api/jellyfin/sessions/playing/progress', {
		method: 'POST',
		body: JSON.stringify({
			ItemId: itemId,
			PlaySessionId: sessionId,
			IsPaused: isPaused,
			PositionTicks: Math.round(positionTicks),
			MediaSourceId: itemId
		})
	});

export const reportJellyfinPlaybackStopped = async (
	itemId: string,
	sessionId: string,
	positionTicks: number
) =>
	await fetch('/api/jellyfin/sessions/playing/stopped', {
		method: 'POST',
		body: JSON.stringify({
			ItemId: itemId,
			PlaySessionId: sessionId,
			PositionTicks: Math.round(positionTicks),
			MediaSourceId: itemId
		}),
		headers: {
			'Content-Type': 'application/json'
		}
	});

export const deleteActiveEncoding = async (playSessionId: string) =>
	await fetch(`/api/jellyfin/videos/activeEncodings?playSessionId=${playSessionId}`, {
		method: 'DELETE'
	});

export const setJellyfinItemWatched = async (jellyfinId: string) =>
	await fetch(`/api/jellyfin/userPlayedItems?itemId=${jellyfinId}`, {
		method: 'POST'
	});

export const setJellyfinItemUnwatched = async (jellyfinId: string) =>
	await fetch(`/api/jellyfin/userPlayedItems?itemId=${jellyfinId}`, {
		method: 'DELETE'
	});

export const jellyfinTestConnection = async (
	baseUrl: string | undefined = undefined,
	apiKey: string | undefined = undefined
) => {
	let request = `/api/jellyfin/testConnection?baseUrl=${baseUrl}`;
	if (apiKey) {
		request += `&apiKey=${apiKey}`;
	}

	return await fetch(request, {
		method: 'GET'
	})
		.then((res) => res.status === 200)
		.catch(() => false);
};

export const getJellyfinPosterUrl = (item: JellyfinItem, quality = 100, original = false) =>
	item.ImageTags?.Primary
		? `${get(settings).jellyfin.baseUrl}/Items/${item?.Id}/Images/Primary?quality=${quality}${
				original ? '' : '&fillWidth=432'
			}&tag=${item?.ImageTags?.Primary}`
		: '';

export const getJellyfinBackdrop = (item: JellyfinItem, quality = 100) => {
	if (item.BackdropImageTags?.length) {
		return `${get(settings).jellyfin.baseUrl}/Items/${
			item?.Id
		}/Images/Backdrop?quality=${quality}&tag=${item?.BackdropImageTags?.[0]}`;
	} else {
		return `${get(settings).jellyfin.baseUrl}/Items/${
			item?.Id
		}/Images/Primary?quality=${quality}&tag=${item?.ImageTags?.Primary}`;
	}
};
