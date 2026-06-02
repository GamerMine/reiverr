import type { components as RadarrComponents } from '$lib/apis/radarr/radarr.generated';

export class RadarrMapper {
	public static customFormatResource(
		langId: number,
		lang: string
	): RadarrComponents['schemas']['CustomFormatResource'] {
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
		qualityDefs: RadarrComponents['schemas']['QualityDefinitionResource'][],
		customFormats: RadarrComponents['schemas']['CustomFormatResource'][]
	): RadarrComponents['schemas']['QualityProfileResource'] {
		const items: RadarrComponents['schemas']['Quality'][] = [];
		let cutoff: number | undefined;
		const remaining = [...qualities];

		for (const def of qualityDefs) {
			const item: RadarrComponents['schemas']['QualityProfileQualityItemResource'] = {};
			const matchIndex = remaining.findIndex((v) => v === def.quality?.name);

			item.allowed = false;
			if (matchIndex !== -1) {
				cutoff = def.quality?.id;
				remaining.splice(matchIndex, 1);
				item.allowed = true;
			}

			items.push(item);
		}

		if (qualities.length > 0)
			console.warn('The following qualities were not found: ', qualities);

		const formatItems: RadarrComponents['schemas']['ProfileFormatItemResource'][] =
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
