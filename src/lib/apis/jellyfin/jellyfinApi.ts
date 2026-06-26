import type { components } from '$lib/apis/jellyfin/jellyfin.generated';
import { settings } from '$lib/stores/settings.svelte.js';

export type JellyfinItem = components['schemas']['BaseItemDto'];

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
