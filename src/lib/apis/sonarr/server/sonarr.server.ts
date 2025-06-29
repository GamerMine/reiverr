import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';
import createClient from 'openapi-fetch';
import type { paths } from '$lib/apis/sonarr/sonarr.generated';

export async function checkSonarrConnection(
	baseURL: string | undefined = undefined,
	apiKey: string | undefined = undefined
) {
	if (!baseURL && !apiKey) {
		baseURL = (await GlobalSettingsEntity.getSonarrBaseUrl()) || undefined;
		apiKey = (await GlobalSettingsEntity.getSonarrApiKey()) || undefined;
	}

	return createClient<paths>({
		baseUrl: baseURL,
		headers: {
			'X-Api-Key': apiKey
		}
	})
		.GET('/api/v3/health')
		.then((res) => {
			return new Response(JSON.stringify(res.data), {
				status: res.response.status,
				statusText: res.response.statusText,
				headers: {
					'Content-Type': 'application/json'
				}
			});
		})
		.catch(() => {
			return new Response(null, {
				status: 404
			});
		});
}
