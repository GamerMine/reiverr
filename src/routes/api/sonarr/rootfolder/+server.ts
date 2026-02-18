import type { RequestHandler } from '@sveltejs/kit';
import createClient from 'openapi-fetch';
import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';
import type { paths } from '$lib/apis/radarr/radarr.generated';
import {assertAdminAuth} from "$lib/apis/utils.server";

export const GET: RequestHandler = async ({ cookies, url }) => {
	await assertAdminAuth(cookies);

	const baseUrl =
		url.searchParams.get('baseUrl') || (await GlobalSettingsEntity.getSonarrBaseUrl());
	const apiKeySearch: string | null = url.searchParams.get('apiKey');
	const apiKeySetting: string | undefined = await GlobalSettingsEntity.getSonarrApiKey();
	const apiKey: string | undefined = apiKeySearch ?? apiKeySetting;

	return createClient<paths>({
		baseUrl: baseUrl || undefined,
		headers: {
			'X-Api-Key': apiKey
		}
	})
		.GET('/api/v3/rootfolder')
		.then((res) => {
			return new Response(JSON.stringify(res.data), {
				status: res.response.status,
				headers: {
					'Content-Type': 'application/json'
				}
			});
		});
};
