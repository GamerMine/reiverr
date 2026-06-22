import * as v from 'valibot';
import type { InferOutput } from 'valibot';

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

export const OptionalStringSchema = v.optional(v.string());
export const ApiSchema = v.object({ url: OptionalStringSchema, key: OptionalStringSchema });
export type Api = InferOutput<typeof ApiSchema>;
