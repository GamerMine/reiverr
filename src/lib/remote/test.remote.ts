import { command, getRequestEvent } from '$app/server';
import { TestTaskSchema } from '../../tasksWorker/tasks/test.server.ts';
import { scheduleTask } from '../../tasksWorker/scheduler.server.ts';
import { TaskType } from '@reiverr/db/types';

export const testAddTask = command(TestTaskSchema, async (testData) => {
	const {
		locals: { user }
	} = getRequestEvent();

	await scheduleTask(user.userId, TaskType.TEST, testData);
});
