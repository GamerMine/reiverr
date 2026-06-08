import type { components as SonarrComponents } from '$lib/apis/sonarr/sonarr.generated';

export class SonarrMapper {
	public static customFormatResource(
		langId: number,
		lang: string
	): SonarrComponents['schemas']['CustomFormatResource'] {
		return {
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
							value: langId
						}
					]
				}
			]
		};
	}

	public static qualityProfileResource(
		name: string,
		lang: string,
		qualities: string[],
		qualityDefs: SonarrComponents['schemas']['QualityDefinitionResource'][],
		customFormats: SonarrComponents['schemas']['CustomFormatResource'][]
	): SonarrComponents['schemas']['QualityProfileResource'] {
		const items: SonarrComponents['schemas']['Quality'][] = [];
		let cutoff: number | undefined;
		const remaining = [...qualities];

		for (const def of qualityDefs) {
			const item: SonarrComponents['schemas']['QualityProfileQualityItemResource'] = {};
			const matchIndex = remaining.findIndex((v) => v === def.quality?.name);

			item.quality = def.quality;
			item.allowed = false;
			if (matchIndex !== -1) {
				cutoff = def.quality?.id;
				remaining.splice(matchIndex, 1);
				item.allowed = true;
			}

			items.push(item);
		}

		if (remaining.length > 0)
			console.warn('The following qualities were not found: ', remaining);

		const formatItems: SonarrComponents['schemas']['ProfileFormatItemResource'][] =
			customFormats.map((f) => ({
				format: f.id,
				name: f.name,
				score: f.name?.includes(lang) ? -1000 : 0
			}));

		return {
			name: `${name} - ${lang} [Reiverr]`,
			cutoff,
			items,
			formatItems,
			minUpgradeFormatScore: 1
		};
	}
}
