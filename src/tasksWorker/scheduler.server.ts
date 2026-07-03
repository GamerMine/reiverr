import { TaskEntity, UserSettingsEntity } from '@reiverr/db/entities';
import { isMainThread, Worker } from 'node:worker_threads';
import { TaskType } from '@reiverr/db/types';
import { tasksWorkerFilename } from './worker.ts';
import Logger, { LogLevel } from '@reiverr/logging';

let workerInstance: Worker;
const logger = Logger.getLogger('Scheduler');

export interface TaskQueueCallback {
	(data: unknown): Promise<void>;
}

export interface TaskExecutor {
	/** Queue the execution of the task.
	 * @param data The data to queue the execution for
	 * @param queue The callback to queue the execution
	 * @returns An array of data to execute the task for or a localized message object if the task failed to queue
	 */
	queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | string>;

	/** Execute the task.
	 * @param data The data to execute the task for
	 * @returns A localized message object if the task failed, undefined otherwise
	 */
	execute(data: unknown): Promise<void | string>;
}

/*
---------------------------------------------------------------------------------------------------
								Svelte server scheduler functions
---------------------------------------------------------------------------------------------------
 */

/** Schedules a task to be executed.
 * @param userId The user identifier of the user that scheduled the task
 * @param type The type of the task to schedule
 * @param data The data to pass to the task executor
 * @param cron The cron expression to schedule the task (optional)
 */
export async function scheduleTask(
	userId: string,
	type: TaskType,
	data: unknown,
	cron: string | null = null
) {
	const user = await UserSettingsEntity.findOneBy({ userId });
	if (!user) {
		logger.log(LogLevel.ERROR, `User with user id "${userId}" does not exists`);
		return;
	}
	await TaskEntity.create({
		user,
		data,
		type,
		cron
	}).save();
}

/** Cancels a task.
 * @param uuid The UUID of the task to cancel
 */
export async function cancelTask(uuid: string) {
	const task = await TaskEntity.get(uuid);

	if (task) {
		task.canceled = new Date();
		await task.save();
	}
}

if (isMainThread) {
	import('$env/dynamic/private').then(({ env }) => {
		workerInstance = new Worker(new URL(tasksWorkerFilename), {
			workerData: {
				DB_TYPE: env.DB_TYPE,
				DB_HOST: env.DB_HOST,
				DB_PORT: Number.parseInt(env.DB_PORT),
				DB_USERNAME: env.DB_USERNAME,
				DB_PASSWORD: env.DB_PASSWORD,
				DB_DATABASE: env.DB_DATABASE
			}
		});

		workerInstance.on('exit', (code: number) => {
			logger.log(LogLevel.INFO, `Tasks worker exited with code: ${code}`);
		});
		workerInstance.on('error', (err: Error) => {
			logger.log(LogLevel.ERROR, err.message);
		});
	});
}
