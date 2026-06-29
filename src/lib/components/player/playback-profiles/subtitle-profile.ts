/**
 * @deprecated - Check @/utils/playback-profiles/index
 */

import type { JellyfinSubtitleProfile } from '@reiverr/connectors/types/jellyfin';

/**
 * Returns a valid SubtitleProfile for the current platform.
 *
 * @returns An array of subtitle profiles for the current platform.
 */
export function getSubtitleProfiles(): Array<JellyfinSubtitleProfile> {
	const SubtitleProfiles: Array<JellyfinSubtitleProfile> = [];

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
