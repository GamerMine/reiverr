import { getRequestEvent } from '$app/server';
import { protectedCommand } from '#lib/server/auth/remote-guards.ts';
import { TestTaskSchema } from '../../tasksWorker/tasks/test.server.ts';
import { scheduleTask } from '../../tasksWorker/scheduler.server.ts';
import { TaskType } from '@reiverr/db/types';

export const testAddTask = protectedCommand(TestTaskSchema, async (testData) => {
	const {
		locals: {
			user: { userId }
		}
	} = getRequestEvent();

	await scheduleTask(userId!,TaskType.TEST, testData);
});
