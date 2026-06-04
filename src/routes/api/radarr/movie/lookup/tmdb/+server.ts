import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import { GlobalSettingsEntity } from '@reiverr/db/entities';
import type { paths } from '$lib/apis/radarr/radarr.generated';
import { assertParam, assertUserAuth } from '$lib/server/utils.server';

export const GET: RequestHandler = async ({ cookies, url }) => {
	await assertUserAuth(cookies);

	const baseUrl = await GlobalSettingsEntity.getRadarrBaseUrl();
	const apiKey = await GlobalSettingsEntity.getRadarrApiKey();
	const tmdbId = assertParam(url, 'tmdbId');

	if (baseUrl && apiKey) {
		return createClient<paths>({
			baseUrl: baseUrl,
			headers: {
				'X-Api-Key': apiKey
			}
		})
			.GET('/api/v3/movie/lookup/tmdb', {
				params: {
					query: {
						tmdbId: tmdbId ? +tmdbId : undefined
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
	} else {
		return new Response(null, {
			status: 404
		});
	}
};
