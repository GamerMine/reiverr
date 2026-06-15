import * as v from 'valibot';
import type { GenericSchema, InferOutput } from 'valibot';

export type TitleType = 'movie' | 'tv' | 'person';
export type SelectOption = {
	value: string;
	label: string;
};
export type SeasonData = {
	overview: string;
	season_number: number;
	episodes: {
		title: string;
		subtitle: string;
		backdropUrl: string;
		airDate: Date | undefined;
	}[];
};

export const MessageObjectSchema = v.object({
	id: v.string(),
	values: v.optional(v.record(v.string(), v.union([v.string(), v.number(), v.date()])))
});
export type MessageObject = InferOutput<typeof MessageObjectSchema>;

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
