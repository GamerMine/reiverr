import type {
	RadarrCustomFormatResource,
	RadarrMovieResource,
	RadarrProfileFormatItemResource,
	RadarrQuality,
	RadarrQualityDefinitionResource,
	RadarrQualityProfileQualityItemResource,
	RadarrQualityProfileResource
} from '../types/radarrTypes.js';
import Logger, { LogLevel } from '@reiverr/logging';

const logger = Logger.getLogger('RadarrRemote');

export class RadarrMapper {
	private static QUALITY_REPLACEMENTS: Map<string, string> = new Map([
		['Bluray-1080p Remux', 'Remux-1080p'],
		['Bluray-2160p Remux', 'Remux-2160p']
	]);

	public static customFormatResource(langId: number, lang: string): RadarrCustomFormatResource {
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
		qualityDefs: RadarrQualityDefinitionResource[],
		customFormats: RadarrCustomFormatResource[]
	): RadarrQualityProfileResource {
		const items: RadarrQuality[] = [];
		let cutoff: number | undefined;
		const remaining = [...qualities];

		for (let i = 0; i < remaining.length; i++) {
			if (this.QUALITY_REPLACEMENTS.has(remaining[i])) {
				remaining[i] = <string>this.QUALITY_REPLACEMENTS.get(remaining[i]);
			}
		}

		for (const def of qualityDefs) {
			const item: RadarrQualityProfileQualityItemResource = {};
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
			logger.log(LogLevel.WARNING, `The following qualities were not found: ${remaining}`);

		const formatItems: RadarrProfileFormatItemResource[] = customFormats.map((f) => ({
			format: f.id,
			name: f.name,
			score: f.name?.includes(lang) ? -1000 : 0
		}));

		return {
			name: `${name} - ${lang} [Reiverr]`,
			cutoff,
			items,
			formatItems,
			language: { id: -1 },
			minUpgradeFormatScore: 1
		};
	}

	public static movieResource(
		tmdbId: number,
		qualityProfileId: number,
		rootFolderPath: string
	): RadarrMovieResource {
		return {
			qualityProfileId,
			monitored: true,
			tmdbId,
			rootFolderPath,
			addOptions: {
				monitor: 'movieOnly',
				searchForMovie: true,
				addMethod: 'manual'
			}
		};
	}
}
