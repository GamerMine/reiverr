import type { TaskExecutor, TaskQueueCallback } from '../scheduler.server';
import * as v from 'valibot';
import Connectors from '@reiverr/connectors';
import { MovieRemoveSchema } from '../types.ts';
import Logger, { LogLevel } from '@reiverr/logging';

const logger = Logger.getLogger('Task:RadarrMovieRemove');

export class RadarrMovieRemove implements TaskExecutor {
	async queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | string> {
		await queue(data);
	}

	async execute(data: unknown): Promise<void | string> {
		const movie = v.parse(MovieRemoveSchema, data);
		const { radarrConnector } = await Connectors.getInstance();

		const res = await radarrConnector?.deleteMovie(movie.radarrId);

		if (!res || !res.response.ok) {
			const err = `Cannot remove movie ${movie.radarrId} from Radarr: ${JSON.stringify(res.error, null, 2)}`;
			logger.log(LogLevel.ERROR, err);
			return err;
		}
	}
}
