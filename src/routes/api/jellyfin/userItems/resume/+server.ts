import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import type { paths } from '$lib/apis/jellyfin/jellyfin.generated';
import { Settings } from '$lib/entities/Settings.server';
import { getUserId } from '$lib/apis/jellyfin/server/jellyfin.server';

export const GET: RequestHandler = async ({ cookies }) => {
	return createClient<paths>({
		baseUrl: (await Settings.getJellyfinBaseUrl()) || undefined,
		headers: {
			Authorization: `MediaBrowser Token="${cookies.get('access_token')}"`
		}
	})
		.GET('/UserItems/Resume', {
			params: {
				query: {
					userId: await getUserId(cookies.get('access_token')),
					mediaTypes: ['Video'],
					fields: ['ProviderIds', 'Genres']
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
