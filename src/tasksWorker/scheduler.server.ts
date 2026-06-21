import { CronExpressionParser } from 'cron-parser';
import { SyncCustomFormats } from './tasks/syncCustomFormats.server.ts';
import { TaskEntity, TaskExecutionEntity } from '@reiverr/db/entities';
import { SyncQualityProfiles } from './tasks/syncQualityProfiles.server.ts';
import { RadarrMovieAdd } from './tasks/radarrMovieAdd.server.ts';
import { RadarrMovieRemove } from './tasks/radarrMovieRemove.server.ts';
import { SonarrSeriesAdd } from './tasks/sonarrSeriesAdd.server.ts';
import { SonarrSeriesRemove } from './tasks/sonarrSeriesRemove.server.ts';
import { isMainThread, Worker } from 'node:worker_threads';
import { type NewTaskMessage } from './messages.server.ts';
import { type MessageObject, TaskType } from '@reiverr/db/types';

let workerInstance: Worker;

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

export const taskExecutors = {
	[TaskType.SYNC_CUSTOM_FORMATS]: new SyncCustomFormats(),
	[TaskType.SYNC_QUALITY_PROFILES]: new SyncQualityProfiles(),

	[TaskType.RADARR_MOVIE_ADD]: new RadarrMovieAdd(),
	[TaskType.RADARR_MOVIE_REMOVE]: new RadarrMovieRemove(),

	[TaskType.SONARR_SERIES_ADD]: new SonarrSeriesAdd(),
	[TaskType.SONARR_SERIES_REMOVE]: new SonarrSeriesRemove()
} satisfies Record<TaskType, TaskExecutor>;

const schedulings: Map<string, NodeJS.Timeout> = new Map();

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
				let execution = new TaskExecutionEntity();
				execution.task = task;
				execution.data = data;
				execution = await execution.save();

				const newTaskMessage: NewTaskMessage = {
					type: 'newTask',
					uuid: execution.uuid
				};
				workerInstance.postMessage(newTaskMessage);
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

if (isMainThread) {
	import('worker.ts?nodeWorker').then((worker) => {
		import('$env/dynamic/private').then(({ env }) => {
			workerInstance = new worker.default({
				workerData: {
					DB_TYPE: env.DB_TYPE,
					DB_HOST: env.DB_HOST,
					DB_PORT: Number.parseInt(env.DB_PORT),
					DB_USERNAME: env.DB_USERNAME,
					DB_PASSWORD: env.DB_PASSWORD,
					DB_DATABASE: env.DB_DATABASE
				}
			});

			workerInstance.on('message', (message: MessageObject) => {});
			workerInstance.on('exit', (code: number) => {
				console.log(code);
			});
			workerInstance.on('error', (err: Error) => {
				console.error(err);
			});

			TaskEntity.getPending().then((tasks) =>
				tasks.forEach((task) => scheduleExecution(task).then(() => task.save()))
			);
		});
	});
}
