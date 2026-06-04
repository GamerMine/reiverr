import createClient from 'openapi-fetch';
import type {
	components as SonarrComponents,
	paths as SonarrPaths
} from '$lib/apis/sonarr/sonarr.generated';
import { GlobalSettingsEntity } from '@reiverr/db/entities';

// TODO: Remove this file when all is moved to Connector
export namespace Sonarr {
	let qualityDefs: SonarrComponents['schemas']['QualityDefinitionResource'][] = [];

	async function getQualityDefs() {
		if (qualityDefs.length === 0) {
			const client = await getClient();

			const { data: defs } = await client.GET('/api/v3/qualitydefinition');
			if (!defs) return qualityDefs;

			qualityDefs = defs;
		}

		return qualityDefs;
	}

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

	export async function addQualityProfile(name: string, lang: string, quals: string[]) {
		const qualities = Array.from(quals);
		const client = await getClient();

		const qualityDefs = await getQualityDefs();
		if (qualityDefs.length === 0)
			return { success: false, error: "Can't get quality definitions from Radarr" };

		const items: SonarrComponents['schemas']['QualityProfileQualityItemResource'][] = [];
		const formatItems: SonarrComponents['schemas']['ProfileFormatItemResource'][] = [];
		let cutoff: number | undefined;

		for (const def of qualityDefs) {
			const item: SonarrComponents['schemas']['QualityProfileQualityItemResource'] = {};
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
