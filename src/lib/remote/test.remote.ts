import { command, getRequestEvent } from '$app/server';
import { TestTaskSchema } from '../../tasksWorker/tasks/test.server.ts';
import { scheduleTask } from '../../tasksWorker/scheduler.server.ts';
import { TaskType } from '@reiverr/db/types';
import { assertUserAuth } from '$lib/server/utils.server.ts';

export const testAddTask = command(TestTaskSchema, async (testData) => {
	const { cookies } = getRequestEvent();
	const { userId } = await assertUserAuth(cookies);
	if (!userId) return { success: false, error: 'general.connectionRequired' };

	await scheduleTask(userId, TaskType.TEST, testData);
});
