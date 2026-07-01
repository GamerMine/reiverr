import type { TaskExecutor, TaskQueueCallback } from '../scheduler.server';
import * as v from 'valibot';
import Connectors from '@reiverr/connectors';
import type { MessageObject } from '@reiverr/db/types';
import { MovieRemoveSchema } from '../types.ts';

export class RadarrMovieRemove implements TaskExecutor {
	async computeDescription(data: unknown): Promise<MessageObject> {
		const movie = v.parse(MovieRemoveSchema, data);
		return {
			id: 'service.tasks.radarrAddMovie.addingMovie',
			values: { id: movie.radarrId }
		};
	}

	async computeExecutionDescription(data: unknown): Promise<MessageObject> {
		const movie = v.parse(MovieRemoveSchema, data);
		return {
			id: 'service.tasks.radarrAddMovie.addingMovie',
			values: { id: movie.radarrId }
		};
	}

	async queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | MessageObject> {
		await queue(data);
	}

	async execute(data: unknown): Promise<void | MessageObject> {
		const movie = v.parse(MovieRemoveSchema, data);
		const { radarrConnector } = await Connectors.getInstance();

		const res = await radarrConnector?.deleteMovie(movie.radarrId);

		if (!res || !res.response.ok) {
			console.error(
				`Cannot remove movie ${movie.radarrId} from Radarr:`,
				res ? JSON.stringify(res.error, null, 2) : 'Unable to connect to Radarr.'
			);
			return { id: 'general.unknownError' };
		}
	}
}
