import type { TaskExecutor, TaskProgressCallback, TaskQueueCallback } from '../scheduler.server';
import * as v from 'valibot';
import Connectors from '@reiverr/connectors';
import type { MessageObject } from '@reiverr/db/types';

export class RadarrMovieRemove implements TaskExecutor {
	async computeDescription(data: unknown): Promise<MessageObject> {
		const id = v.parse(v.number(), data);
		return {
			id: 'service.tasks.radarrAddMovie.addingMovie',
			values: { id }
		};
	}

	async computeExecutionDescription(data: unknown): Promise<MessageObject> {
		const id = v.parse(v.number(), data);
		return {
			id: 'service.tasks.radarrAddMovie.addingMovie',
			values: { id }
		};
	}

	async queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | MessageObject> {
		await queue(data);
	}

	async execute(data: unknown, progress: TaskProgressCallback): Promise<void | MessageObject> {
		const id = v.parse(v.number(), data);
		const { radarrConnector } = await Connectors.getInstance();
		await progress(0, 1);

		const res = await radarrConnector?.deleteMovie(id);

		if (!res || !res.response.ok) {
			console.error(
				`Cannot remove movie ${id} from Radarr:`,
				res ? JSON.stringify(res.error, null, 2) : 'Unable to connect to Radarr.'
			);
			return { id: 'general.unknownError' };
		}
		await progress(1, 1);
	}
}
