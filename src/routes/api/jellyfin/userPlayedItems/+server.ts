import type { RequestHandler } from '@sveltejs/kit';
import type { paths } from '$lib/apis/jellyfin/jellyfin.generated';
import createClient from 'openapi-fetch';
import { Settings } from '$lib/entities/Settings.server';
import { getUserId } from '$lib/apis/jellyfin/server/jellyfin.server';

export const POST: RequestHandler = async ({ cookies, url }) => {
	return createClient<paths>({
		baseUrl: (await Settings.getJellyfinBaseUrl()) || undefined,
		headers: {
			Authorization: `MediaBrowser Token="${cookies.get('access_token')}"`
		}
	})
		.POST('/UserPlayedItems/{itemId}', {
			params: {
				path: {
					itemId: url.searchParams.get('itemId') || ''
				},
				query: {
					userId: (await getUserId(cookies.get('access_token'))) || '',
					datePlayed: new Date().toISOString()
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

export const DELETE: RequestHandler = async ({ cookies, url }) => {
	return createClient<paths>({
		baseUrl: (await Settings.getJellyfinBaseUrl()) || undefined,
		headers: {
			Authorization: `MediaBrowser Token="${cookies.get('access_token')}"`
		}
	})
		.DELETE('/UserPlayedItems/{itemId}', {
			params: {
				path: {
					itemId: url.searchParams.get('itemId') || ''
				},
				query: {
					userId: (await getUserId(cookies.get('access_token'))) || ''
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
