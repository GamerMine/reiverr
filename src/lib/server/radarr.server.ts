import createClient from 'openapi-fetch';
import type { paths as RadarrPaths } from '$lib/apis/radarr/radarr.generated';
import { GlobalSettingsEntity } from '@reiverr/db/entities';

// TODO: Remove this file when all is moved to Connector
export namespace Radarr {
	export async function getClient() {
		const baseUrl = await GlobalSettingsEntity.getRadarrBaseUrl();
		const apiKey = await GlobalSettingsEntity.getRadarrApiKey();

		if (!baseUrl || !apiKey) throw 'Cannot create Radarr client without api informations';

		return createClient<RadarrPaths>({
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
		if (!baseURL || !apiKey) return false;

		const conn = await createClient<RadarrPaths>({
			baseUrl: baseURL,
			headers: {
				'X-Api-Key': apiKey
			}
		}).GET('/api/v3/health');

		return conn.response.ok;
	}
}
