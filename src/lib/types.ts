import * as v from 'valibot';
import type { GenericSchema, InferOutput } from 'valibot';

export type TitleType = 'movie' | 'tv' | 'person';
export type SelectOption = {
	value: string;
	label: string;
};
type EpisodeData = {
	title: string;
	subtitle: string;
	backdropUrl: string;
	airDate: Date | undefined;
	overview: string;
	episodeNumber: number;
};
export type EpisodeDataWithCheck = EpisodeData & {
	checked: boolean;
};

export type SeasonData = {
	seasonNumber: number;
	episodes: EpisodeData[];
};
export type SeasonDataWithCheck = SeasonData & {
	checked: boolean;
	episodes: EpisodeDataWithCheck[];
};

export type Result<TResultData extends object | undefined> = {
	success: boolean;
	error?: string;
	data?: TResultData;
};

export const PlatformSchema = v.picklist(['radarr', 'sonarr']);
export type Platform = InferOutput<typeof PlatformSchema>;
export function PlatformWithDataSchema<TDataSchema extends GenericSchema>(dataSchema: TDataSchema) {
	return v.object({
		platform: PlatformSchema,
		data: dataSchema
	});
}

export const OptionalStringSchema = v.optional(v.string());
export const ApiSchema = v.object({ url: OptionalStringSchema, key: OptionalStringSchema });
export type Api = InferOutput<typeof ApiSchema>;
export const SeriesAddSchema = v.object({
	tvdbId: v.number(),
	language: v.string(),
	seasons: v.array(
		v.object({
			seasonNumber: v.number(),
			checked: v.boolean(),
			episodes: v.array(
				v.object({
					episodeNumber: v.number(),
					checked: v.boolean()
				})
			)
		})
	)
});
export type SeriesAdd = InferOutput<typeof SeriesAddSchema>;
