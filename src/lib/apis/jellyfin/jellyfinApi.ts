import type { components } from '$lib/apis/jellyfin/jellyfin.generated';
import type { DeviceProfile } from '$lib/apis/jellyfin/playback-profiles';
import { settings } from '$lib/stores/settings.svelte.js';

export type JellyfinItem = components['schemas']['BaseItemDto'];

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
		? `${settings.globalSettings.jellyfin.baseUrl}/Items/${item?.Id}/Images/Primary?quality=${quality}${
				original ? '' : '&fillWidth=432'
			}&tag=${item?.ImageTags?.Primary}`
		: '';

export const getJellyfinBackdrop = (item: JellyfinItem, quality = 100) => {
	if (item.BackdropImageTags?.length) {
		return `${settings.globalSettings.jellyfin.baseUrl}/Items/${
			item?.Id
		}/Images/Backdrop?quality=${quality}&tag=${item?.BackdropImageTags?.[0]}`;
	} else {
		return `${settings.globalSettings.jellyfin.baseUrl}/Items/${
			item?.Id
		}/Images/Primary?quality=${quality}&tag=${item?.ImageTags?.Primary}`;
	}
};
