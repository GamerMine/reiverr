import * as v from 'valibot';
import type { GenericSchema, InferOutput } from 'valibot';

export const PlatformSchema = v.picklist(['radarr', 'sonarr']);
export type Platform = InferOutput<typeof PlatformSchema>;
export function PlatformWithDataSchema<TDataSchema extends GenericSchema>(dataSchema: TDataSchema) {
	return v.object({
		platform: PlatformSchema,
		data: dataSchema
	});
}

export const MovieAddSchema = v.object({
	tmdbId: v.number(),
	name: v.string(),
	language: v.string(),
	userId: v.string()
});
export type MovieAdd = InferOutput<typeof MovieAddSchema>;

export const MovieRemoveSchema = v.object({
	radarrId: v.number(),
	name: v.string()
});

export const SeriesAddSchema = v.object({
	tvdbId: v.number(),
	name: v.string(),
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
	),
	userId: v.string()
});

export const SeriesRemoveSchema = v.object({
	sonarrId: v.number(),
	name: v.string()
});
export type SeriesAdd = InferOutput<typeof SeriesAddSchema>;
