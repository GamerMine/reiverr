/**
 * @deprecated - Check @/utils/playback-profiles/index
 */

import type { components as JellyfinComponents } from '$lib/apis/jellyfin/jellyfin.generated';
import {
	isApple,
	isChromiumBased,
	isEdge,
	isMobile,
	isPs4,
	isTizen,
	isTv,
	isWebOS,
	isXbox,
	safariVersion
} from '$lib/utils/browser-detection';

/**
 * Gets the max video bitrate
 *
 * @returns Returns the MaxVideoBitrate
 */
function getGlobalMaxVideoBitrate(): number | undefined {
	let isTizenFhd = false;

	if (
		isTizen() &&
		'webapis' in window &&
		typeof window.webapis === 'object' &&
		window.webapis &&
		'productinfo' in window.webapis &&
		typeof window.webapis.productinfo === 'object' &&
		window.webapis.productinfo &&
		'isUdPanelSupported' in window.webapis.productinfo &&
		typeof window.webapis.productinfo.isUdPanelSupported === 'function'
	) {
		isTizenFhd = !window.webapis.productinfo.isUdPanelSupported();
	}

	// TODO: These values are taken directly from Jellyfin-web.
	// The source of them needs to be investigated.
	if (isPs4()) {
		return 8_000_000;
	}

	if (isXbox()) {
		return 12_000_000;
	}

	if (isTizen() && isTizenFhd) {
		return 20_000_000;
	}
}

/**
 * Creates a profile condition object for use in device playback profiles.
 *
 * @param Property - Value for the property
 * @param Condition - Condition that the property must comply with
 * @param Value - Value to check in the condition
 * @param IsRequired - Whether this property is required
 * @returns - Constructed ProfileCondition object
 */
function createProfileCondition(
	Property: JellyfinComponents['schemas']['ProfileConditionValue'],
	Condition: JellyfinComponents['schemas']['ProfileConditionType'],
	Value: string,
	IsRequired = false
): JellyfinComponents['schemas']['ProfileCondition'] {
	return {
		Condition,
		Property,
		Value,
		IsRequired
	};
}

/**
 * Gets the AAC audio codec profile conditions
 *
 * @param videoTestElement - A HTML video element for testing codecs
 * @returns - Array of ACC Profile conditions
 */
export function getAacCodecProfileConditions(
	videoTestElement: HTMLVideoElement
): JellyfinComponents['schemas']['ProfileCondition'][] {
	const supportsSecondaryAudio = isTizen();

	const conditions: JellyfinComponents['schemas']['ProfileCondition'][] = [];

	// Handle he-aac not supported
	if (
		!videoTestElement
			.canPlayType('video/mp4; codecs="avc1.640029, mp4a.40.5"')
			.replace(/no/, '')
	) {
		// TODO: This needs to become part of the stream url in order to prevent stream copy
		conditions.push(createProfileCondition('AudioProfile', 'NotEquals', 'HE-AAC'));
	}

	if (!supportsSecondaryAudio) {
		conditions.push(createProfileCondition('IsSecondaryAudio', 'Equals', 'false'));
	}

	return conditions;
}

/**
 * Gets an array with all the codec profiles that this client supports
 *
 * @param videoTestElement - A HTML video element for testing codecs
 * @returns - Array containing the different profiles for the client
 */
export function getCodecProfiles(
	videoTestElement: HTMLVideoElement
): JellyfinComponents['schemas']['CodecProfile'][] {
	const CodecProfiles: JellyfinComponents['schemas']['CodecProfile'][] = [];

	const aacProfileConditions = getAacCodecProfileConditions(videoTestElement);

	const supportsSecondaryAudio = isTizen();

	if (aacProfileConditions.length > 0) {
		CodecProfiles.push({
			Type: 'VideoAudio',
			Codec: 'aac',
			Conditions: aacProfileConditions
		});
	}

	if (!supportsSecondaryAudio) {
		CodecProfiles.push({
			Type: 'VideoAudio',
			Conditions: [createProfileCondition('IsSecondaryAudio', 'Equals', 'false')]
		});
	}

	let maxH264Level = 42;
	let h264Profiles = 'high|main|baseline|constrained baseline';

	if (
		isTv() ||
		videoTestElement.canPlayType('video/mp4; codecs="avc1.640833"').replace(/no/, '')
	) {
		maxH264Level = 51;
	}

	if (videoTestElement.canPlayType('video/mp4; codecs="avc1.640834"').replace(/no/, '')) {
		maxH264Level = 52;
	}

	if (
		(isTizen() ||
			videoTestElement.canPlayType('video/mp4; codecs="avc1.6e0033"').replace(/no/, '')) && // TODO: These tests are passing in Safari, but playback is failing
		(!isApple() || !isWebOS() || !(isEdge() && !isChromiumBased()))
	) {
		h264Profiles += '|high 10';
	}

	let maxHevcLevel = 120;
	let hevcProfiles = 'main';
	const hevcProfilesMain10 = 'main|main 10';

	// HEVC Main profile, Level 4.1
	if (
		videoTestElement.canPlayType('video/mp4; codecs="hvc1.1.4.L123"').replace(/no/, '') ||
		videoTestElement.canPlayType('video/mp4; codecs="hev1.1.4.L123"').replace(/no/, '')
	) {
		maxHevcLevel = 123;
	}

	// HEVC Main10 profile, Level 4.1
	if (
		videoTestElement.canPlayType('video/mp4; codecs="hvc1.2.4.L123"').replace(/no/, '') ||
		videoTestElement.canPlayType('video/mp4; codecs="hev1.2.4.L123"').replace(/no/, '')
	) {
		maxHevcLevel = 123;
		hevcProfiles = hevcProfilesMain10;
	}

	// HEVC Main10 profile, Level 5.1
	if (
		videoTestElement.canPlayType('video/mp4; codecs="hvc1.2.4.L153"').replace(/no/, '') ||
		videoTestElement.canPlayType('video/mp4; codecs="hev1.2.4.L153"').replace(/no/, '')
	) {
		maxHevcLevel = 153;
		hevcProfiles = hevcProfilesMain10;
	}

	// HEVC Main10 profile, Level 6.1
	if (
		videoTestElement.canPlayType('video/mp4; codecs="hvc1.2.4.L183"').replace(/no/, '') ||
		videoTestElement.canPlayType('video/mp4; codecs="hev1.2.4.L183"').replace(/no/, '')
	) {
		maxHevcLevel = 183;
		hevcProfiles = hevcProfilesMain10;
	}

	const hevcCodecProfileConditions: JellyfinComponents['schemas']['ProfileCondition'][] = [
		createProfileCondition('IsAnamorphic', 'NotEquals', 'true'),
		createProfileCondition('VideoProfile', 'EqualsAny', hevcProfiles),
		createProfileCondition('VideoLevel', 'LessThanEqual', maxHevcLevel.toString())
	];

	const h264CodecProfileConditions: JellyfinComponents['schemas']['ProfileCondition'][] = [
		createProfileCondition('IsAnamorphic', 'NotEquals', 'true'),
		createProfileCondition('VideoProfile', 'EqualsAny', h264Profiles),
		createProfileCondition('VideoLevel', 'LessThanEqual', maxH264Level.toString())
	];

	if (!isTv()) {
		h264CodecProfileConditions.push(
			createProfileCondition('IsInterlaced', 'NotEquals', 'true')
		);
		hevcCodecProfileConditions.push(
			createProfileCondition('IsInterlaced', 'NotEquals', 'true')
		);
	}

	const globalMaxVideoBitrate = (getGlobalMaxVideoBitrate() || '').toString();

	if (globalMaxVideoBitrate) {
		h264CodecProfileConditions.push(
			createProfileCondition('VideoBitrate', 'LessThanEqual', globalMaxVideoBitrate, true)
		);
	}

	if (globalMaxVideoBitrate) {
		hevcCodecProfileConditions.push(
			createProfileCondition('VideoBitrate', 'LessThanEqual', globalMaxVideoBitrate, true)
		);
	}

	// On iOS 12.x, for TS container max h264 level is 4.2
	if (isApple() && isMobile() && Number(safariVersion()) < 13) {
		const codecProfile: JellyfinComponents['schemas']['CodecProfile'] = {
			Type: 'Video',
			Codec: 'h264',
			Container: 'ts',
			Conditions: h264CodecProfileConditions.filter((condition) => {
				return condition.Property !== 'VideoLevel';
			})
		};

		codecProfile.Conditions?.push(createProfileCondition('VideoLevel', 'LessThanEqual', '42'));

		CodecProfiles.push(codecProfile);
	}

	CodecProfiles.push(
		{
			Type: 'Video',
			Codec: 'h264',
			Conditions: h264CodecProfileConditions
		},
		{
			Type: 'Video',
			Codec: 'hevc',
			Conditions: hevcCodecProfileConditions
		}
	);

	return CodecProfiles;
}
