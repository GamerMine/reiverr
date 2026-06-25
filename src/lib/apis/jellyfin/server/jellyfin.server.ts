import createClient from 'openapi-fetch';
import type { paths } from '$lib/apis/jellyfin/jellyfin.generated';
import { GlobalSettingsEntity } from '@reiverr/db/entities';
import { getBrowserName } from '$lib/utils/browser-detection';
import { version } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import { JellyfinConnector } from '@reiverr/connectors';

export const JELLYFIN_DEVICE = getBrowserName();
export const JELLYFIN_CLIENT_VERSION = version;

export async function getUserId(accessToken: string | undefined) {
	const baseUrl = await GlobalSettingsEntity.getJellyfinBaseUrl();

	if (baseUrl) {
		return await createClient<paths>({
			baseUrl: baseUrl,
			headers: {
				Authorization: `MediaBrowser Token="${accessToken}", Client="${JellyfinConnector.JELLYFIN_CLIENT}", Device="${JELLYFIN_DEVICE}", Version="${JELLYFIN_CLIENT_VERSION}"`
			}
		})
			.GET('/Users/Me', {})
			.then((res) => res.data?.Id)
			.catch((_) => {
				return undefined;
			});
	} else {
		return '';
	}
}

export async function isJellyfinUserConnected(cookies: Cookies) {
	const baseUrl = await GlobalSettingsEntity.getJellyfinBaseUrl();
	if (!baseUrl) throw 'Jellyfin API is not defined';

	return createClient<paths>({
		baseUrl: baseUrl,
		headers: {
			Authorization: `MediaBrowser Token="${cookies.get('access_token')}"`
		}
	})
		.GET('/Users/Me')
		.then((res) => {
			return res;
		});
}

export async function checkJellyfinConnection(baseURL: string, apiKey: string) {
	return createClient<paths>({
		baseUrl: baseURL,
		headers: {
			Authorization: `MediaBrowser Token="${apiKey}"`
		}
	})
		.GET('/Users', {
			params: {
				query: {
					isHidden: false,
					isDisabled: false
				}
			}
		})
		.then((res) => {
			return new Response(JSON.stringify(res.data), {
				status: res.response.status,
				statusText: res.response.statusText,
				headers: {
					'Content-Type': 'application/json'
				}
			});
		})
		.catch(() => {
			return new Response(null, {
				status: 404
			});
		});
}
