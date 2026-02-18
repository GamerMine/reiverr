import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';
import type { paths } from '$lib/apis/sonarr/sonarr.generated';
import {assertUserAuth} from "$lib/apis/utils.server";

export const GET: RequestHandler = async ({cookies}) => {
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
			.GET('/api/v3/queue', {
				params: {
					query: {
						includeEpisode: true,
						includeSeries: true
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
