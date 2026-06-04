import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import { GlobalSettingsEntity } from '@reiverr/db/entities';
import type { paths } from '$lib/apis/sonarr/sonarr.generated';
import { assertUserAuth } from '$lib/server/utils.server';

export const GET: RequestHandler = async ({ cookies, url }) => {
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
			.GET('/api/v3/release', {
				params: {
					query: {
						episodeId: url.searchParams.get('episodeId')
							? Number(url.searchParams.get('episodeId'))
							: undefined,
						seriesId: url.searchParams.get('seriesId')
							? Number(url.searchParams.get('seriesId'))
							: undefined,
						seasonNumber: url.searchParams.get('seasonNumber')
							? Number(url.searchParams.get('seasonNumber'))
							: undefined
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

	const baseUrl = await GlobalSettingsEntity.getSonarrBaseUrl();
	const apiKey = await GlobalSettingsEntity.getSonarrApiKey();
	const requestData = await request.json();

	if (baseUrl && apiKey) {
		return createClient<paths>({
			baseUrl: baseUrl,
			headers: {
				'X-Api-Key': apiKey
			}
		})
			.POST('/api/v3/release', {
				body: {
					indexerId: requestData.indexerId,
					guid: requestData.guid
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
