import { query } from '$app/server';
import { getTasksState } from '../../tasksWorker/scheduler.server.ts';

export const getTasks = query.live(async function* () {
	while (true) {
		yield getTasksState();
		await new Promise((f) => setTimeout(f, 500));
	}
});
