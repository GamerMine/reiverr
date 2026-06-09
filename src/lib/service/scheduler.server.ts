import type { MessageObject } from '$lib/types';
import { TestExecutor } from '$lib/service/tasks/test.server';
import { CronExpressionParser } from 'cron-parser';
import { SyncCustomFormats } from '$lib/server/tasks/syncCustomFormats.server';
import { TaskEntity, TaskExecutionEntity } from '@reiverr/db/entities';
import { SyncQualityProfiles } from '$lib/server/tasks/syncQualityProfiles.server';
import { RadarrMovieAdd } from '$lib/server/tasks/radarrMovieAdd.server';
import { RadarrMovieRemove } from '$lib/server/tasks/radarrMovieRemove.server';

export interface TaskProgressCallback {
	(current: number, total: number): Promise<void>;
}

export interface TaskQueueCallback {
	(data: unknown): Promise<void>;
}

export interface TaskExecutor {
	/** Compute the description of the task.
	 * @param data The data to compute the description for
	 * @returns The description of the task as a localized message object
	 */
	computeDescription(data: unknown): Promise<MessageObject>;

	/** Compute the description of the execution.
	 * @param data The data to compute the description for
	 * @returns The description of the execution as a localized message object
	 */
	computeExecutionDescription(data: unknown): Promise<MessageObject>;

	/** Queue the execution of the task.
	 * @param data The data to queue the execution for
	 * @param queue The callback to queue the execution
	 * @returns An array of data to execute the task for or a localized message object if the task failed to queue
	 */
	queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | MessageObject>;

	/** Execute the task.
	 * @param data The data to execute the task for
	 * @param progress The progress callback that can be used to report progress (optional, don't call if the task is atomic)
	 * @returns A localized message object if the task failed, undefined otherwise
	 */
	execute(data: unknown, progress: TaskProgressCallback): Promise<void | MessageObject>;
}

export enum TaskType {
	TEST = 'test',
	SYNC_CUSTOM_FORMATS = 'syncCustomFormat',
	SYNC_QUALITY_PROFILES = 'syncQualityProfiles',
	RADARR_MOVIE_ADD = 'radarrMovieAdd',
	RADARR_MOVIE_REMOVE = 'radarrMovieRemove'
}

export const taskExecutors = {
	[TaskType.TEST]: new TestExecutor(),
	[TaskType.SYNC_CUSTOM_FORMATS]: new SyncCustomFormats(),
	[TaskType.SYNC_QUALITY_PROFILES]: new SyncQualityProfiles(),
	[TaskType.RADARR_MOVIE_ADD]: new RadarrMovieAdd(),
	[TaskType.RADARR_MOVIE_REMOVE]: new RadarrMovieRemove()
} satisfies Record<TaskType, TaskExecutor>;

const schedulings: Map<string, NodeJS.Timeout> = new Map();

/**
 * Initializes the worker thread if it hasn't been initialized yet.
 */
export function initWorker() {
	console.log('Worker initialized');

	TaskEntity.getPending().then((tasks) =>
		tasks.forEach((task) => scheduleExecution(task).then(() => task.save()))
	);
}

async function scheduleExecution(task: TaskEntity) {
	if (task.cron) {
		try {
			const interval = CronExpressionParser.parse(task.cron);
			const scheduled = interval.next().toDate();

			schedulings.set(
				task.uuid,
				setInterval(async () => {
					await queueExecution(task);
				}, scheduled.getTime() - Date.now())
			);
			task.scheduled = scheduled;
		} catch (error) {
			console.error('Invalid cron expression: ', error);
		}
	} else {
		await queueExecution(task);
	}
}

async function unscheduleExecution(task: TaskEntity) {
	const scheduling = schedulings.get(task.uuid);

	if (scheduling) {
		scheduling.close();
		schedulings.delete(task.uuid);
		task.scheduled = null;
	}
}

async function queueExecution(task: TaskEntity) {
	if (task.type in taskExecutors) {
		try {
			const error = await taskExecutors[task.type].queueExecution(task.data, async (data) => {
				const execution = new TaskExecutionEntity();
				execution.task = task;
				execution.data = data;
				await execution.save();
				console.log(
					`${task.type} execution result:`,
					await taskExecutors[task.type].execute(data, async (current, total) => {
						console.log(
							`${task.type} with data: ${JSON.stringify(data)} progress: ${current}/${total}`
						);
					})
				);
			});

			if (error) {
				task.error = error;
			}
		} catch (error) {
			console.error('Error while queueing task execution: ', error);
			task.error = {
				id: 'service.messages.queuingFailed',
				values: { error: error as string }
			};
		}
	} else {
		console.error(`Unknown task type: ${task.type}`);
		task.error = { id: 'service.messages.unknownTaskType', values: { type: task.type } };
	}

	task.executed = new Date();
	await task.save();
}

/** Schedules a task to be executed.
 * @param type The type of the task to schedule
 * @param data The data to pass to the task executor
 * @param cron The cron expression to schedule the task (optional)
 * @returns The task entity
 */
export async function scheduleTask(
	type: TaskType,
	data: unknown,
	cron: string | null = null
): Promise<TaskEntity> {
	const task = new TaskEntity();
	task.data = data;
	task.type = type;
	task.cron = cron;

	const saved = await task.save();
	await scheduleExecution(saved);

	return saved;
}

/** Modifies a task.
 * @param task The task to modify
 */
export async function modifyTask(task: TaskEntity) {
	await unscheduleExecution(task);
	await scheduleExecution(task);
	await task.save();
}

/** Cancels a task.
 * @param uuid The UUID of the task to cancel
 */
export async function cancelTask(uuid: string) {
	const task = await TaskEntity.get(uuid);

	if (task) {
		task.canceled = new Date();
		await task.save();
		await unscheduleExecution(task);
	}
}
