import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import type { paths } from '$lib/apis/jellyfin/jellyfin.generated';
import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';

export const GET: RequestHandler = async () => {
	return createClient<paths>({
		baseUrl: (await GlobalSettingsEntity.getJellyfinBaseUrl()) || undefined,
		headers: {
			Authorization: `MediaBrowser Token="${await GlobalSettingsEntity.getJellyfinApiKey()}"`
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
				headers: {
					'Content-Type': 'application/json'
				}
			});
		})
		.catch((err) => {
			return new Response(JSON.stringify({}), {
				statusText: err.cause.code
			});
		});
};

export const DELETE: RequestHandler = async ({ cookies }) => {
	cookies.delete('access_token', {
		httpOnly: true,
		secure: false,
		path: '/',
		maxAge: 0
	});

	return new Response(null);
};
