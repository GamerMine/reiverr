import type { TaskExecutor, TaskProgressCallback, TaskQueueCallback } from '../scheduler.server';
import * as v from 'valibot';
import Connectors from '@reiverr/connectors';
import type { MessageObject } from '@reiverr/db/types';

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
		const { sonarrConnector } = await Connectors.getInstance();
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
