import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';
import createClient from 'openapi-fetch';
import type { paths } from '$lib/apis/sonarr/sonarr.generated';

export namespace Sonarr {
	export async function getClient() {
		const baseUrl = await GlobalSettingsEntity.getSonarrBaseUrl();
		const apiKey = await GlobalSettingsEntity.getSonarrApiKey();

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
			baseURL = (await GlobalSettingsEntity.getSonarrBaseUrl()) || undefined;
			apiKey = (await GlobalSettingsEntity.getSonarrApiKey()) || undefined;
		}
		if (!baseURL || !apiKey) return false;

		const conn = await createClient<paths>({
			baseUrl: baseURL,
			headers: {
				'X-Api-Key': apiKey
			}
		}).GET('/api/v3/health');

		return conn.response.ok;
	}

	export async function addCustomFormat(lang: string) {
		const client = await getClient();
		if (!client) return { success: false, error: 'Radarr host not set' };

		const { data: languages } = await client.GET('/api/v3/language');
		if (!languages) return { success: false, error: "Can't get languages from Sonarr" };
		const sonarrLang = languages.find((e) => e.nameLower === lang);
		if (!sonarrLang || !sonarrLang.id)
			return { success: false, error: `Can't find language: ${lang} on Sonarr` };

		const res = await client.POST('/api/v3/customformat', {
			body: {
				name: `Not ${lang}`,
				specifications: [
					{
						name: `Not ${lang}`,
						implementation: 'LanguageSpecification',
						negate: true,
						required: false,
						fields: [
							{
								name: 'value',
								value: sonarrLang.id
							}
						]
					}
				]
			}
		});

		if (!res.response.ok || !res.data)
			return { success: false, error: res.response.statusText };
		else return { success: true, id: res.data.id };
	}

	export async function deleteCustomFormats(id: number[]) {
		const client = await getClient();
		if (!client) return { success: false, error: 'Sonarr host not set' };

		const res = await client.DELETE('/api/v3/customformat/bulk', {
			body: {
				ids: id
			}
		});

		return { success: res.response.ok };
	}

	export async function getAllCustomFormats() {
		const client = await getClient();
		if (!client) return undefined;

		return await client.GET('/api/v3/customformat');
	}
}
