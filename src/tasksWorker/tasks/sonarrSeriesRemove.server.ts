import type { TaskExecutor, TaskQueueCallback } from '../scheduler.server';
import * as v from 'valibot';
import Connectors from '@reiverr/connectors';
import type { MessageObject } from '@reiverr/db/types';
import { SeriesRemoveSchema } from '../types.ts';

export class SonarrSeriesRemove implements TaskExecutor {
	async computeDescription(data: unknown): Promise<MessageObject> {
		const series = v.parse(SeriesRemoveSchema, data);
		return {
			id: 'service.tasks.sonarrRemoveSeries.removingSeries',
			values: { seriesId: series.sonarrId }
		};
	}

	async computeExecutionDescription(data: unknown): Promise<MessageObject> {
		const series = v.parse(SeriesRemoveSchema, data);
		return {
			id: 'service.tasks.sonarrRemoveSeries.removingSeries',
			values: { seriesId: series.sonarrId }
		};
	}

	async queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | MessageObject> {
		await queue(data);
	}

	async execute(data: unknown): Promise<void | MessageObject> {
		const series = v.parse(SeriesRemoveSchema, data);
		const { sonarrConnector } = await Connectors.getInstance();

		const res = await sonarrConnector?.deleteSeries(series.sonarrId);

		if (!res || !res.response.ok) {
			console.error(
				`Cannot remove series ${series.sonarrId} from Sonarr:`,
				res ? JSON.stringify(res.error, null, 2) : 'Unable to connect to Sonarr.'
			);
			return { id: 'general.unknownError' };
		}
	}
}
