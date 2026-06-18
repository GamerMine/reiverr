import type {
	TaskExecutor,
	TaskProgressCallback,
	TaskQueueCallback
} from '$lib/service/scheduler.server';
import { type MessageObject } from '$lib/types';
import * as v from 'valibot';
import { BaseSync } from '$lib/server/tasks/baseSync.server';

export class SonarrSeriesRemove implements TaskExecutor {
	async computeDescription(data: unknown): Promise<MessageObject> {
		const seriesId = v.parse(v.number(), data);
		return {
			id: 'service.tasks.sonarrRemoveSeries.removingSeries',
			values: { seriesId }
		};
	}

	async computeExecutionDescription(data: unknown): Promise<MessageObject> {
		const seriesId = v.parse(v.number(), data);
		return {
			id: 'service.tasks.sonarrRemoveSeries.removingSeries',
			values: { seriesId }
		};
	}

	async queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | MessageObject> {
		await queue(data);
	}

	async execute(data: unknown, progress: TaskProgressCallback): Promise<void | MessageObject> {
		const seriesId = v.parse(v.number(), data);
		const { sonarrConnector } = await BaseSync.getInstance();
		await progress(0, 1);

		const res = await sonarrConnector?.deleteSeries(seriesId);

		if (!res || !res.response.ok) {
			console.error(
				`Cannot remove series ${seriesId} from Sonarr:`,
				res ? JSON.stringify(res.error, null, 2) : 'Unable to connect to Sonarr.'
			);
			return { id: 'general.unknownError' };
		}

		await progress(1, 1);
	}
}
