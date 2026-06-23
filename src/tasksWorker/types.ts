import * as v from 'valibot';
import type { GenericSchema, InferOutput } from 'valibot';
import { TaskType } from '@reiverr/db/types';

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
	language: v.string(),
	userId: v.string()
});
export type MovieAdd = InferOutput<typeof MovieAddSchema>;

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
	),
	userId: v.string()
});
export type SeriesAdd = InferOutput<typeof SeriesAddSchema>;

export type UUID = string;
export const TaskState = {
	QUEUED: 'queued',
	STARTED: 'started',
	ERROR: 'error',
	CANCELED: 'canceled',
	COMPLETED: 'completed'
} as const;
export type TaskStateType = (typeof TaskState)[keyof typeof TaskState];

export type TaskStatus = {
	type: TaskType;
	data: unknown;
	progress:
		| {
				current: number;
				total: number;
		  }
		| undefined;
	state: TaskStateType;
};
