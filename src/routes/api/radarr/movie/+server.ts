import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';
import type { paths } from '$lib/apis/radarr/radarr.generated';
import {assertParam, assertUserAuth} from "$lib/apis/utils.server";

export const GET: RequestHandler = async ({cookies}) => {
	await assertUserAuth(cookies);

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

export const POST: RequestHandler = async ({ cookies, request }) => {
	await assertUserAuth(cookies);
	
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

export const DELETE: RequestHandler = async ({cookies, url}) => {
	await assertUserAuth(cookies);

	const baseUrl = await GlobalSettingsEntity.getRadarrBaseUrl();
	const apiKey = await GlobalSettingsEntity.getRadarrApiKey();
	const movieId = assertParam(url, "movieId");
	const deleteFiles = assertParam(url, "deleteFiles");

	if (baseUrl && apiKey) {
		return createClient<paths>({
			baseUrl: baseUrl,
			headers: {
				'X-Api-Key': apiKey
			}
		})
			.DELETE(`/api/v3/movie/{id}`, {
				params: {
					path: {
						id: +movieId
					},
					query: {
						deleteFiles: (deleteFiles === 'true')
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
		return new Response(JSON.stringify({}), {
			statusText: 'No address provided'
		});
	}
}
