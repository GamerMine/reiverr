import type { components } from '$lib/apis/radarr/radarr.generated';
import { settings } from '$lib/stores/settings.svelte.js';

export type DiskSpaceInfo = components['schemas']['DiskSpaceResource'];
export type RadarrMovie = components['schemas']['MovieResource'];

export const getDiskSpace = async (): Promise<DiskSpaceInfo[]> => {
	return (
		(await fetch('/api/radarr/diskspace', {
			method: 'GET'
		}).then(async (res) => (await res.json()) || [])) || Promise.resolve([])
	);
};

export function getRadarrPosterUrl(item: RadarrMovie, original = false) {
	const url =
		settings.globalSettings.radarr.baseUrl +
		(item.images?.find((i) => i.coverType === 'poster')?.url || '');

	if (!original) return url.replace('poster.jpg', `poster-${500}.jpg`);

	return url;
}
