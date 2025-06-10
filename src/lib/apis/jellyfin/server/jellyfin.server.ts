import createClient from 'openapi-fetch';
import type { components, paths } from '$lib/apis/jellyfin/jellyfin.generated';
import { Settings } from '$lib/entities/Settings.server';
import { getBrowserName } from '$lib/utils/browser-detection';
import { version } from '$app/environment';
import * as crypto from 'node:crypto';

export const JELLYFIN_DEVICE = getBrowserName();
export const JELLYFIN_CLIENT = 'Reiverr Web Client';
export const JELLYFIN_CLIENT_VERSION = version;

export type JellyfinAuthenticationResult = components['schemas']['AuthenticationResult'];

async function getSHA256Hash(input: string) {
	const textAsBuffer = new TextEncoder().encode(input);
	const hashBuffer = await crypto.subtle.digest('SHA-256', textAsBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((item) => item.toString(16).padStart(2, '0')).join('');
}

export async function getUserId(accessToken: string | undefined) {
	return await createClient<paths>({
		baseUrl: (await Settings.getJellyfinBaseUrl()) || undefined,
		headers: {
			Authorization: `MediaBrowser Token="${accessToken}", Client="${JELLYFIN_CLIENT}", Device="${JELLYFIN_DEVICE}", Version="${JELLYFIN_CLIENT_VERSION}"`
		}
	})
		.GET('/Users/Me', {})
		.then((res) => res.data?.Id);
}

export async function getUserName(accessToken: string | undefined) {
	return await createClient<paths>({
		baseUrl: (await Settings.getJellyfinBaseUrl()) || undefined,
		headers: {
			Authorization: `MediaBrowser Token="${accessToken}", Client="${JELLYFIN_CLIENT}", Device="${JELLYFIN_DEVICE}", Version="${JELLYFIN_CLIENT_VERSION}"`
		}
	})
		.GET('/Users/Me', {})
		.then((res) => res.data?.Name);
}

export async function getDeviceId(accessToken: string | undefined) {
	const username = (await getUserName(accessToken)) || undefined;

	return getSHA256Hash(username + JELLYFIN_CLIENT);
}

export async function getDeviceIdFromUsername(username: string) {
	return getSHA256Hash(username + JELLYFIN_CLIENT);
}
