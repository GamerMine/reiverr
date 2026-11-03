import type { InferOutput } from 'valibot';
import { ApiSchema } from '#lib/utils/schemas.ts';

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

export type Api = InferOutput<typeof ApiSchema>;
