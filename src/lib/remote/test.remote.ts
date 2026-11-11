import { command, getRequestEvent } from '$app/server';
import { TestTaskSchema } from '../../tasksWorker/tasks/test.server.ts';
import { scheduleTask } from '../../tasksWorker/scheduler.server.ts';
import { TaskType } from '@unifarr/db/types';

export const testAddTask = command(TestTaskSchema, async (testData) => {
	const {
		locals: {
			user: { userId }
		}
	} = getRequestEvent();

	if (!userId) return { success: false, error: 'general.connectionRequired' };

	await scheduleTask(userId, TaskType.TEST, testData);
});
