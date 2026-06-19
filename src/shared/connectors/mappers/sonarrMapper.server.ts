import type {
	SonarrCustomFormatResource,
	SonarrEpisodesMonitoredResource,
	SonarrProfileFormatItemResource,
	SonarrQuality,
	SonarrQualityDefinitionResource,
	SonarrQualityProfileQualityItemResource,
	SonarrQualityProfileResource,
	SonarrSeriesResource
} from '../types/sonarrTypes';

export class SonarrMapper {
	public static customFormatResource(langId: number, lang: string): SonarrCustomFormatResource {
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
		qualityDefs: SonarrQualityDefinitionResource[],
		customFormats: SonarrCustomFormatResource[]
	): SonarrQualityProfileResource {
		const items: SonarrQuality[] = [];
		let cutoff: number | undefined;
		const remaining = [...qualities];

		for (const def of qualityDefs) {
			const item: SonarrQualityProfileQualityItemResource = {};
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

		const formatItems: SonarrProfileFormatItemResource[] = customFormats.map((f) => ({
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

	public static seriesResource(
		tvdbId: number,
		qualityProfileId: number,
		rootFolderPath: string,
		seasonsToMonitor: { seasonNumber: number; monitored: boolean }[]
	): SonarrSeriesResource {
		return {
			title: 'NONE',
			seasons: seasonsToMonitor,
			qualityProfileId,
			monitored: true,
			tvdbId,
			rootFolderPath,
			addOptions: {
				ignoreEpisodesWithFiles: true,
				ignoreEpisodesWithoutFiles: false,
				searchForMissingEpisodes: true
			}
		};
	}

	public static episodesMonitoredResource(episodeIds: number[]): SonarrEpisodesMonitoredResource {
		return {
			episodeIds,
			monitored: true
		};
	}
}
