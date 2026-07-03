import type { TaskExecutor, TaskQueueCallback } from '../scheduler.server';
import * as v from 'valibot';
import Connectors from '@reiverr/connectors';
import { SeriesRemoveSchema } from '../types.ts';
import Logger, { LogLevel } from '@reiverr/logging';

const logger = Logger.getLogger('Task:SonarrSeriesRemove');

export class SonarrSeriesRemove implements TaskExecutor {
	async queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | string> {
		await queue(data);
	}

	async execute(data: unknown): Promise<void | string> {
		const series = v.parse(SeriesRemoveSchema, data);
		const { sonarrConnector } = await Connectors.getInstance();

		const res = await sonarrConnector?.deleteSeries(series.sonarrId);

		if (!res.response.ok) {
			const err = `Cannot remove series ${series.sonarrId} from Sonarr: ${JSON.stringify(res.error, null, 2)}`;
			logger.log(LogLevel.ERROR, err);
			return err;
		}
	}
}
