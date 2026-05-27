import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';
import createClient from 'openapi-fetch';
import type { paths } from '$lib/apis/sonarr/sonarr.generated';
import type { components } from '$lib/apis/sonarr/sonarr.generated';

export namespace Sonarr {
	let qualityDefs: components['schemas']['Quality'][] = [];

	async function getQualityDefs() {
		if (qualityDefs.length === 0) {
			const client = await getClient();
			if (!client) return qualityDefs;

			const { data: defs } = await client.GET('/api/v3/qualitydefinition');
			if (!defs) return qualityDefs;

			qualityDefs = defs;
		}

		return qualityDefs;
	}

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

		// FIXME: Instead of asking the API each time we create a Custom Format,
		//  all the available languages cache it (like Quality Definitions)
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

	export async function addQualityProfile(name: string, lang: string, qualities: string[]) {
		const client = await getClient();
		if (!client) return { success: false, error: 'Radarr host not set' };

		const qualityDefs = await getQualityDefs();
		if (qualityDefs.length === 0)
			return { success: false, error: "Can't get quality definitions from Radarr" };

		const items: components['schemas']['QualityProfileQualityItemResource'][] = [];
		const formatItems: components['schemas']['ProfileFormatItemResource'][] = [];
		let cutoff: number | undefined;

		for (const def of qualityDefs) {
			const item: components['schemas']['QualityProfileQualityItemResource'] = {};
			item.quality = def;
			item.allowed = false;
			for (let i = 0; i < qualities.length; i++) {
				if (qualities[i] === def.name) {
					item.allowed = true;
					cutoff = def.id;
					qualities = qualities.splice(i, 1);
				}
			}

			items.push(item);
		}

		if (qualities.length > 0)
			console.warn('The following qualities were not found: ', qualities);

		const { data: formats } = await client.GET('/api/v3/customformat');
		if (formats) {
			for (const format of formats) {
				formatItems.push({
					id: format.id,
					name: format.name,
					score: format.name?.includes(lang) ? -1000 : 0
				});
			}
		}

		const res = await client.POST('/api/v3/qualityprofile', {
			body: {
				name: `${name} - ${lang}`,
				cutoff: cutoff,
				items: items,
				formatItems: formatItems,
				minUpgradeFormatScore: 1
			}
		});

		if (!res.response.ok || !res.data)
			return { success: false, error: res.response.statusText };
		return { success: res.response.ok, id: res.data.id };
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
