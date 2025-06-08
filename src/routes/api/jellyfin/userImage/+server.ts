import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import type { paths } from '$lib/apis/jellyfin/jellyfin.generated';
import { Settings } from '$lib/entities/Settings.server';

export const GET: RequestHandler = async ({ url }) => {
	return createClient<paths>({
		baseUrl: (await Settings.getJellyfinBaseUrl()) || undefined,
		headers: {
			Authorization: `MediaBrowser Token="${await Settings.getJellyfinApiKey()}"`
		}
	})
		.GET('/UserImage', {
			params: {
				query: {
					userId: url.searchParams.get('userId') ?? undefined,
					format: 'Png',
					width: 26 * 10
				}
			},
			parseAs: 'stream'
		})
		.then((res) => {
			return new Response(res.data, {
				status: res.response.status,
				headers: {
					'Content-Type': 'image/png'
				}
			});
		});
};
