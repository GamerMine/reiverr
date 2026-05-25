import createClient from 'openapi-fetch';
import type { paths } from '$lib/apis/radarr/radarr.generated';
import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';

export namespace Radarr {
	export async function getClient() {
		const baseUrl = await GlobalSettingsEntity.getRadarrBaseUrl();
		const apiKey = await GlobalSettingsEntity.getRadarrApiKey();

		if (!baseUrl || !apiKey) return undefined;

		return createClient<paths>({
			baseUrl: baseUrl,
			headers: {
				'X-Api-Key': apiKey
			}
		});
	}

	export async function checkConnection(
		baseURL: string | undefined = undefined,
		apiKey: string | undefined = undefined
	) {
		if (!baseURL && !apiKey) {
			baseURL = (await GlobalSettingsEntity.getRadarrBaseUrl()) || undefined;
			apiKey = (await GlobalSettingsEntity.getRadarrApiKey()) || undefined;
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

	export async function getAllCustomProfiles() {
		const client = await getClient();
		if (!client) return undefined;

		return await client.GET('/api/v3/customformat');
	}

}