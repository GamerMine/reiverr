import { Settings } from '$lib/entities/Settings.server';
import type { LayoutServerLoad } from './$types';
import createClient from 'openapi-fetch';
import type { paths } from '$lib/apis/jellyfin/jellyfin.generated';
import { type Cookies, redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const settings = await Settings.getClient();
	const isConnected = await isJellyfinUserConnected(cookies);

	if (url.pathname !== '/login' && isConnected.status !== 200) {
		throw redirect(301, '/login');
	}

	return {
		settings
	};
};

async function isJellyfinUserConnected(cookies: Cookies) {
	return createClient<paths>({
		baseUrl: (await Settings.getJellyfinBaseUrl()) || undefined,
		headers: {
			Authorization: `MediaBrowser Token="${cookies.get('access_token')}"`
		}
	})
		.GET('/Users/Me')
		.then((res) => {
			return new Response(JSON.stringify(res.data), {
				status: res.response.status,
				headers: {
					'Content-Type': 'application/json'
				}
			});
		});
}
