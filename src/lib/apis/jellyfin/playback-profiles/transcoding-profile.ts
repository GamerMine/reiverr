/**
 * @deprecated - Check @/utils/playback-profiles/index
 */

import type { components as JellyfinComponents } from '$lib/apis/jellyfin/jellyfin.generated';
import { getSupportedAudioCodecs } from './helpers/audio-formats';
import { getSupportedMP4AudioCodecs } from './helpers/mp4-audio-formats';
import { getSupportedMP4VideoCodecs, hasVp8Support } from './helpers/mp4-video-formats';
import { canPlayNativeHls, canPlayHlsWithMSE, hasMkvSupport } from './helpers/transcoding-formats';
import { getSupportedTsAudioCodecs } from './helpers/ts-audio-formats';
import { getSupportedTsVideoCodecs } from './helpers/ts-video-formats';
import {
	isTv,
	isApple,
	isEdge,
	isChromiumBased,
	isAndroid,
	isTizen
} from '$lib/utils/browser-detection';

/**
 * Returns a valid TranscodingProfile for the current platform.
 *
 * @param videoTestElement - A HTML video element for testing codecs
 * @returns An array of transcoding profiles for the current platform.
 */
export function getTranscodingProfiles(
	videoTestElement: HTMLVideoElement
): Array<JellyfinComponents['schemas']['TranscodingProfile']> {
	const TranscodingProfiles: JellyfinComponents['schemas']['TranscodingProfile'][] = [];
	const physicalAudioChannels = isTv() ? 6 : 2;

	const hlsBreakOnNonKeyFrames =
		isApple() || (isEdge() && !isChromiumBased()) || !canPlayNativeHls(videoTestElement);

	const mp4AudioCodecs = getSupportedMP4AudioCodecs(videoTestElement);
	const mp4VideoCodecs = getSupportedMP4VideoCodecs(videoTestElement);
	const canPlayHls = canPlayNativeHls(videoTestElement) || canPlayHlsWithMSE();

	if (canPlayHls) {
		TranscodingProfiles.push({
			// hlsjs, edge, and android all seem to require ts container
			CopyTimestamps: false,
			EnableAudioVbrEncoding: false,
			EnableMpegtsM2TsMode: false,
			EnableSubtitlesInManifest: false,
			EstimateContentLength: false,
			SegmentLength: 0,
			TranscodeSeekInfo: 'Auto',
			Container:
				!canPlayNativeHls(videoTestElement) ||
				(isEdge() && !isChromiumBased()) ||
				isAndroid()
					? 'ts'
					: 'aac',
			Type: 'Audio',
			AudioCodec: 'aac',
			Context: 'Streaming',
			Protocol: 'hls',
			MaxAudioChannels: physicalAudioChannels.toString(),
			MinSegments: isApple() ? 2 : 1,
			BreakOnNonKeyFrames: hlsBreakOnNonKeyFrames
		});
	}

	for (const audioFormat of ['aac', 'mp3', 'opus', 'wav'].filter((format) =>
		getSupportedAudioCodecs(format)
	)) {
		TranscodingProfiles.push({
			BreakOnNonKeyFrames: false,
			CopyTimestamps: false,
			EnableAudioVbrEncoding: false,
			EnableMpegtsM2TsMode: false,
			EnableSubtitlesInManifest: false,
			EstimateContentLength: false,
			MinSegments: 0,
			SegmentLength: 0,
			TranscodeSeekInfo: 'Auto',
			Container: audioFormat,
			Type: 'Audio',
			AudioCodec: audioFormat,
			Context: 'Streaming',
			Protocol: 'http',
			MaxAudioChannels: physicalAudioChannels.toString()
		});
	}

	const hlsInTsVideoCodecs = getSupportedTsVideoCodecs(videoTestElement);
	const hlsInTsAudioCodecs = getSupportedTsAudioCodecs(videoTestElement);

	if (canPlayHls && hlsInTsVideoCodecs.length > 0 && hlsInTsAudioCodecs.length > 0) {
		TranscodingProfiles.push({
			CopyTimestamps: false,
			EnableAudioVbrEncoding: false,
			EnableMpegtsM2TsMode: false,
			EnableSubtitlesInManifest: false,
			EstimateContentLength: false,
			SegmentLength: 0,
			TranscodeSeekInfo: 'Auto',
			Container: 'ts',
			Type: 'Video',
			AudioCodec: hlsInTsAudioCodecs.join(','),
			VideoCodec: hlsInTsVideoCodecs.join(','),
			Context: 'Streaming',
			Protocol: 'hls',
			MaxAudioChannels: physicalAudioChannels.toString(),
			MinSegments: isApple() ? 2 : 1,
			BreakOnNonKeyFrames: hlsBreakOnNonKeyFrames
		});
	}

	if (hasMkvSupport(videoTestElement) && !isTizen()) {
		TranscodingProfiles.push({
			BreakOnNonKeyFrames: false,
			EnableAudioVbrEncoding: false,
			EnableMpegtsM2TsMode: false,
			EnableSubtitlesInManifest: false,
			EstimateContentLength: false,
			MinSegments: 0,
			SegmentLength: 0,
			TranscodeSeekInfo: 'Auto',
			Container: 'mkv',
			Type: 'Video',
			AudioCodec: mp4AudioCodecs.join(','),
			VideoCodec: mp4VideoCodecs.join(','),
			Context: 'Streaming',
			MaxAudioChannels: physicalAudioChannels.toString(),
			CopyTimestamps: true
		});
	}

	if (hasVp8Support(videoTestElement)) {
		TranscodingProfiles.push({
			BreakOnNonKeyFrames: false,
			CopyTimestamps: false,
			EnableAudioVbrEncoding: false,
			EnableMpegtsM2TsMode: false,
			EnableSubtitlesInManifest: false,
			EstimateContentLength: false,
			MinSegments: 0,
			SegmentLength: 0,
			TranscodeSeekInfo: 'Auto',
			Container: 'webm',
			Type: 'Video',
			AudioCodec: 'vorbis',
			VideoCodec: 'vpx',
			Context: 'Streaming',
			Protocol: 'http',
			// If audio transcoding is needed, limit channels to number of physical audio channels
			// Trying to transcode to 5 channels when there are only 2 speakers generally does not sound good
			MaxAudioChannels: physicalAudioChannels.toString()
		});
	}

	return TranscodingProfiles;
}
