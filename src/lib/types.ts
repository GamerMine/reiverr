import * as v from 'valibot';
import type { InferOutput } from 'valibot';

export type TitleType = 'movie' | 'tv' | 'person';
export type TitleId = {
	id: number;
	provider: 'tmdb' | 'tvdb';
	type: TitleType;
};
export type SelectOption = {
	value: string;
	label: string;
};
export const MessageObjectSchema = v.object({
	id: v.string(),
	values: v.optional(v.record(v.string(), v.union([v.string(), v.number(), v.date()])))
});
export type MessageObject = InferOutput<typeof MessageObjectSchema>;

export type Result<TResultData extends object> = {
	success: boolean;
	error?: string;
	data?: TResultData;
};

export const ExecutionPlatformSchema = v.picklist(['radarr', 'sonarr']);
