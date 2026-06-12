/**
 * @deprecated - Check @/utils/playback-profiles/index
 */

import type { components as JellyfinComponents } from '$lib/apis/jellyfin/jellyfin.generated';

/**
 * Returns a valid SubtitleProfile for the current platform.
 *
 * @returns An array of subtitle profiles for the current platform.
 */
export function getSubtitleProfiles(): Array<JellyfinComponents['schemas']['SubtitleProfile']> {
	const SubtitleProfiles: Array<JellyfinComponents['schemas']['SubtitleProfile']> = [];

	SubtitleProfiles.push(
		{
			Format: 'vtt',
			Method: 'External'
		},
		{
			Format: 'ass',
			Method: 'External'
		},
		{
			Format: 'ssa',
			Method: 'External'
		}
	);

	return SubtitleProfiles;
}
