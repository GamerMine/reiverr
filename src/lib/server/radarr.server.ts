import createClient from 'openapi-fetch';
import type {
	components as RadarrComponents,
	paths as RadarrPaths
} from '$lib/apis/radarr/radarr.generated';
import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';

export namespace Radarr {
	let qualityDefs: RadarrComponents['schemas']['QualityDefinitionResource'][] = [];
	let languages: RadarrComponents['schemas']['LanguageResource'][] = [];

	async function getQualityDefs() {
		if (qualityDefs.length === 0) {
			const client = await getClient();

			const { data: defs } = await client.GET('/api/v3/qualitydefinition');
			if (!defs) return qualityDefs;

			qualityDefs = defs;
		}

		return qualityDefs;
	}

	async function getLanguages() {
		if (languages.length === 0) {
			const client = await getClient();
			if (!client) return languages;

			const { data: langs } = await client.GET('/api/v3/language');
			if (!langs) return languages;

			languages = langs;
		}

		return languages;
	}

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

	export async function addCustomFormat(lang: string) {
		const client = await getClient();

		const languages = await getLanguages();
		if (languages.length === 0)
			return { success: false, error: "Can't get languages from Radarr" };
		const radarrLang = languages.find((e) => e.nameLower === lang);
		if (!radarrLang || !radarrLang.id)
			return { success: false, error: `Can't find language: ${lang} on Radarr` };

		const res = await client.POST('/api/v3/customformat', {
			body: {
				name: `Not ${lang} [Reiverr]`,
				specifications: [
					{
						name: `Not ${lang} [Reiverr]`,
						implementation: 'LanguageSpecification',
						negate: true,
						required: false,
						fields: [
							{
								name: 'value',
								value: radarrLang.id
							}
						]
					}
				]
			}
		});

		if (!res.response.ok || !res.data)
			return { success: false, error: JSON.stringify(res.error, null, 2) };
		else return { success: true, id: res.data.id };
	}

	export async function addQualityProfile(name: string, lang: string, quals: string[]) {
		const qualities = Array.from(quals);
		const client = await getClient();

		const qualityDefs = await getQualityDefs();
		if (qualityDefs.length === 0)
			return { success: false, error: "Can't get quality definitions from Radarr" };

		const items: RadarrComponents['schemas']['QualityProfileQualityItemResource'][] = [];
		const formatItems: RadarrComponents['schemas']['ProfileFormatItemResource'][] = [];
		let cutoff: number | undefined;

		// Radarr does not use the same naming for Remux qualities as Sonarr.
		for (let i = 0; i < qualities.length; i++) {
			if (qualities[i].includes('Remux'))
				qualities[i] = qualities[i].replace('Bluray', 'Remux').split(' ')[0];
		}

		for (const def of qualityDefs) {
			const item: RadarrComponents['schemas']['QualityProfileQualityItemResource'] = {};
			item.quality = def.quality;
			item.allowed = false;
			for (let i = 0; i < qualities.length; i++) {
				if (qualities[i] === def.quality?.name) {
					item.allowed = true;
					cutoff = def.quality.id;
					qualities.splice(i, 1);
					break;
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
					format: format.id,
					name: format.name,
					score: format.name?.includes(lang) ? -1000 : 0
				});
			}
		}

		const res = await client.POST('/api/v3/qualityprofile', {
			body: {
				name: `${name} - ${lang} [Reiverr]`,
				cutoff: cutoff,
				items: items,
				formatItems: formatItems,
				minUpgradeFormatScore: 1
			}
		});

		if (!res.response.ok || !res.data)
			return { success: false, error: JSON.stringify(res.error, null, 2) };
		return { success: res.response.ok, id: res.data.id };
	}

	export async function deleteCustomFormats(id: number[]) {
		const client = await getClient();

		const res = await client.DELETE('/api/v3/customformat/bulk', {
			body: {
				ids: id
			}
		});

		return { success: res.response.ok };
	}
}
