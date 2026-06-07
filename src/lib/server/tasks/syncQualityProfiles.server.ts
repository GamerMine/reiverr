import type {
	TaskExecutor,
	TaskProgressCallback,
	TaskQueueCallback
} from '$lib/service/scheduler.server';
import { ExecutionPlatformSchema, type MessageObject } from '$lib/types';
import { BaseSync } from '$lib/server/tasks/baseSync.server';
import * as v from 'valibot';
import type { InferOutput } from 'valibot';

const ModifiedProfilesIdsSchema = v.array(v.number());
export type ModifiedProfilesIds = InferOutput<typeof ModifiedProfilesIdsSchema>;

export class SyncQualityProfiles implements TaskExecutor {
	async computeExecutionDescription(data: unknown): Promise<MessageObject> {
		void data;
		return { id: 'service.tasks.sync.qualitySync' };
	}

	async computeDescription(data: unknown): Promise<MessageObject> {
		const platform = v.parse(ExecutionPlatformSchema, data);
		return { id: 'service.tasks.sync.qualitySyncOn', values: { platform } };
	}

	async queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | MessageObject> {
		void data;
		const baseSync = await BaseSync.getInstance();

		if (baseSync.radarrConnector?.isHealthy()) {
			await queue('radarr');
		}

		if (baseSync.sonarrConnector?.isHealthy()) {
			await queue('sonarr');
		}
	}

	async execute(data: unknown, progress: TaskProgressCallback): Promise<void | MessageObject> {
		const platform = v.parse(ExecutionPlatformSchema, data);
		const baseSync = await BaseSync.getInstance();

		if (
			platform === 'radarr' &&
			baseSync.radarrConnector &&
			(await baseSync.radarrConnector.isHealthy())
		) {
			if (baseSync.radarrQualities.length === 0)
				return { id: 'service.messages.noQualitiesRadarr' };
		}

		if (
			platform === 'sonarr' &&
			baseSync.sonarrConnector &&
			(await baseSync.sonarrConnector.isHealthy())
		) {
			if (baseSync.sonarrQualities.length === 0)
				return { id: 'service.messages.noQualitiesSonarr' };
		}
	}

	async runOnRadarr() {}
}
