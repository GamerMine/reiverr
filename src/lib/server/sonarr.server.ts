import createClient from 'openapi-fetch';
import type { paths as SonarrPaths } from '$lib/apis/sonarr/sonarr.generated';
import { GlobalSettingsEntity } from '@reiverr/db/entities';

// TODO: Remove this file when all is moved to Connector
export namespace Sonarr {
	export async function getClient() {
		const baseUrl = await GlobalSettingsEntity.getSonarrBaseUrl();
		const apiKey = await GlobalSettingsEntity.getSonarrApiKey();

		if (!baseUrl || !apiKey) throw 'Cannot create Sonarr client without api informations';

		return createClient<SonarrPaths>({
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
			baseURL = (await GlobalSettingsEntity.getSonarrBaseUrl()) || undefined;
			apiKey = (await GlobalSettingsEntity.getSonarrApiKey()) || undefined;
		}
		if (!baseURL || !apiKey) return false;

		const conn = await createClient<SonarrPaths>({
			baseUrl: baseURL,
			headers: {
				'X-Api-Key': apiKey
			}
		}).GET('/api/v3/health');

		return conn.response.ok;
	}
}
