import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';
import type { paths } from '$lib/apis/radarr/radarr.generated';

export const GET: RequestHandler = async ({ url }) => {
	const baseUrl = await GlobalSettingsEntity.getRadarrBaseUrl();
	const apiKey = await GlobalSettingsEntity.getRadarrApiKey();
	const tmdbId = url.searchParams.get('tmdbId');

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
