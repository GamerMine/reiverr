import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import { GlobalSettingsEntity } from '@reiverr/db/entities';
import type { paths } from '$lib/apis/radarr/radarr.generated';
import { assertUserAuth } from '$lib/server/utils.server';

export const GET: RequestHandler = async ({ cookies }) => {
	await assertUserAuth(cookies);

	const baseUrl = await GlobalSettingsEntity.getSonarrBaseUrl();
	const apiKey = await GlobalSettingsEntity.getSonarrApiKey();

	if (baseUrl && apiKey) {
		return createClient<paths>({
			baseUrl: baseUrl,
			headers: {
				'X-Api-Key': apiKey
			}
		})
			.GET('/api/v3/qualityprofile')
			.then((res) => {
				return new Response(JSON.stringify(res.data), {
					status: res.response.status,
					headers: {
						'Content-Type': 'application/json'
					}
				});
			});
	} else {
		return new Response(null, {
			status: 404
		});
	}
};
