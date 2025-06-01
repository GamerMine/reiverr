import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import type { paths } from '$lib/apis/jellyfin/jellyfin.generated';
import { Settings } from '$lib/entities/Settings.server';
import { getDeviceId } from '$lib/apis/jellyfin/server/jellyfin.server';

export const DELETE: RequestHandler = async ({ cookies, url }) => {
	return createClient<paths>({
		baseUrl: (await Settings.getJellyfinBaseUrl()) || undefined,
		headers: {
			Authorization: `MediaBrowser Token="${cookies.get('access_token')}"`
		}
	})
		.DELETE('/Videos/ActiveEncodings', {
			params: {
				query: {
					deviceId: await getDeviceId(cookies.get('access_token')),
					playSessionId: url.searchParams.get('playSessionId') || ''
				}
			}
		})
		.then((res) => {
			return new Response(JSON.stringify(res.data), {
				status: res.response.status,
				headers: {
					'Content-Type': 'application/json'
				}
			});
		});
};
