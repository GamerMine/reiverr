import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';
import type { paths } from '$lib/apis/radarr/radarr.generated';
import { assertUserAuth } from '$lib/server/utils.server';

export const GET: RequestHandler = async ({ cookies, url }) => {
	await assertUserAuth(cookies);

	const baseUrl =
		url.searchParams.get('baseUrl') || (await GlobalSettingsEntity.getRadarrBaseUrl());
	const apiKeySearch: string | null = url.searchParams.get('apiKey');
	const apiKeySetting: string | undefined = await GlobalSettingsEntity.getRadarrApiKey();
	const apiKey: string | undefined = apiKeySearch ?? apiKeySetting;

	if (baseUrl && apiKey) {
		return createClient<paths>({
			baseUrl: baseUrl,
			headers: {
				'X-Api-Key': apiKey
			}
		})
			.GET('/api/v3/health')
			.then((res) => {
				return new Response(JSON.stringify(res.data), {
					status: res.response.status,
					headers: {
						'Content-Type': 'application/json'
					}
				});
			});
	} else {
		return new Response(JSON.stringify({}), {
			status: 404,
			statusText: 'No address provided'
		});
	}
};
