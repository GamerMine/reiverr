import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';
import type { paths } from '$lib/apis/radarr/radarr.generated';

export const GET: RequestHandler = async () => {
	const baseUrl = await GlobalSettingsEntity.getRadarrBaseUrl();
	const apiKey = await GlobalSettingsEntity.getRadarrApiKey();

	if (baseUrl && apiKey) {
		return createClient<paths>({
			baseUrl: baseUrl,
			headers: {
				'X-Api-Key': apiKey
			}
		})
			.GET('/api/v3/movie')
			.then((res) => {
				return new Response(JSON.stringify(res.data), {
					status: res.response.status,
					headers: {
						'Content-Type': 'application/json'
					}
				});
			})
			.catch((e) => {
				return new Response(JSON.stringify({}), {
					statusText: e.cause.code
				});
			});
	} else {
		return new Response(JSON.stringify({}), {
			statusText: 'No address provided'
		});
	}
};

export const POST: RequestHandler = async ({ request }) => {
	const baseUrl = await GlobalSettingsEntity.getRadarrBaseUrl();
	const apiKey = await GlobalSettingsEntity.getRadarrApiKey();
	const requestData = await request.json();

	if (baseUrl && apiKey) {
		return createClient<paths>({
			baseUrl: baseUrl,
			headers: {
				'X-Api-Key': apiKey
			}
		})
			.POST('/api/v3/movie', {
				body: requestData
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
		return new Response(JSON.stringify({}), {
			statusText: 'No address provided'
		});
	}
};
