import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import type { paths } from '$lib/apis/jellyfin/jellyfin.generated';
import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';

export const GET: RequestHandler = async ({ url }) => {
	const apiKeySearch: string | null = url.searchParams.get('apiKey');
	const apiKeySetting: string | null | undefined = await GlobalSettingsEntity.getJellyfinApiKey();
	const apiKey: string | null | undefined = apiKeySearch ?? apiKeySetting;

	return createClient<paths>({
		baseUrl: url.searchParams.get('baseUrl') || undefined,
		headers: {
			Authorization: `MediaBrowser Token="${apiKey}"`
		}
	})
		.GET('/System/Info')
		.then((res) => {
			return new Response(JSON.stringify(res.data), {
				status: res.response.status,
				headers: {
					'Content-Type': 'application/json'
				}
			});
		});
};
