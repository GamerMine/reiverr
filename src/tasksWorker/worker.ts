import { isMainThread, parentPort, workerData } from 'node:worker_threads';
import { TaskEntity, TaskExecutionEntity } from '@reiverr/db/entities';
import TypeOrm from '@reiverr/db';
import { TaskType } from '@reiverr/db/types';
import { TestTask } from './tasks/test.server.ts';
import { SyncCustomFormats } from './tasks/syncCustomFormats.server.ts';
import { SyncQualityProfiles } from './tasks/syncQualityProfiles.server.ts';
import { RadarrMovieAdd } from './tasks/radarrMovieAdd.server.ts';
import { RadarrMovieRemove } from './tasks/radarrMovieRemove.server.ts';
import { SonarrSeriesAdd } from './tasks/sonarrSeriesAdd.server.ts';
import { SonarrSeriesRemove } from './tasks/sonarrSeriesRemove.server.ts';
import type { TaskExecutor } from './scheduler.server.ts';
import { CronExpressionParser } from 'cron-parser';

export const tasksWorkerFilename = import.meta.url;

/**
 * Here is how the tasks system works:
 * 1. The Svelte server uses scheduleTask() from scheduler.server.ts providing a TaskType and optionally
 * 	  data and/or a cron string
 *
 * 2. The tasks worker thread is constantly polling for new tasks from the database
 *
 * 3. When a new task is found, it is prepared and added to queuedTasks or schedulings (in case it is using cron)
 *    New entities are created in the database called TaskExecution. These are the representation of what the worker
 *    will actually execute.
 *    If, for some reason a task cannot be prepared because it returned an error on it throws, then no TaskExecution
 *    are created and the task is added to queuedTasks. (Note that it will be picked up on the next loop iteration.)
 *
 * 4. TaskExecutions of the task are executed. In case of an error or a throw, other TaskExecution will be executed and
 *    marked as finished.
 *    At the end the task is always marked as executed, meaning that this task can't be added back to the queue.
 *
 * 5. Go back to 1
 *
 * NOTE: Tasks status can be obtained from the database.
 */

let running = true;
const queuedTasks: Set<string> = new Set();
const schedulings: Map<string, NodeJS.Timeout> = new Map();

const taskExecutors = {
	[TaskType.TEST]: new TestTask(),

	[TaskType.SYNC_CUSTOM_FORMATS]: new SyncCustomFormats(),
	[TaskType.SYNC_QUALITY_PROFILES]: new SyncQualityProfiles(),

	[TaskType.RADARR_MOVIE_ADD]: new RadarrMovieAdd(),
	[TaskType.RADARR_MOVIE_REMOVE]: new RadarrMovieRemove(),

	[TaskType.SONARR_SERIES_ADD]: new SonarrSeriesAdd(),
	[TaskType.SONARR_SERIES_REMOVE]: new SonarrSeriesRemove()
} satisfies Record<TaskType, TaskExecutor>;

async function run() {
	TypeOrm.init(workerData);
	if (!workerData) throw 'No database credentials information. Tasks worker is not running.';
	await TypeOrm.getDb();
	console.log('Tasks worker initialized');

	while (running) {
		const pendingTasks = await TaskEntity.getPending();
		for (const task of pendingTasks) {
			if (!queuedTasks.has(task.uuid) && !schedulings.has(task.uuid)) {
				await scheduleExecution(task);
			}
		}

		const [taskUuid] = queuedTasks;
		if (taskUuid) await executeTask(await TaskEntity.get(taskUuid));

		await new Promise((f) => setTimeout(f, 500));
	}
}

async function scheduleExecution(task: TaskEntity) {
	if (task.cron) {
		try {
			const interval = CronExpressionParser.parse(task.cron);
			const scheduled = interval.next().toDate();

			task.scheduled = scheduled;
			task = await task.save();

			schedulings.set(
				task.uuid,
				setInterval(async () => {
					await queueExecution(task);
				}, scheduled.getTime() - Date.now())
			);
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
			let executions: TaskExecutionEntity[] = [];
			const error = await taskExecutors[task.type].queueExecution(task.data, async (data) => {
				executions.push(
					TaskExecutionEntity.create({
						task,
						data,
						created: new Date()
					})
				);
			});

			if (error) {
				console.error('Error while queueing task execution:', error);
				task.error = error;
				task.executed = new Date();
				await task.save();
			} else {
				console.info('Adding task execution:', task.type);
				await TaskExecutionEntity.save(executions);
				queuedTasks.add(task.uuid);
			}
		} catch (error) {
			console.error('Error while queueing task execution:', error);
			task.error = {
				id: 'service.messages.queuingFailed',
				values: { error: error as string }
			};
			task.executed = new Date();
			await task.save();
		}
	} else {
		console.error(`Unknown task type: ${task.type}`);
		task.error = { id: 'service.messages.unknownTaskType', values: { type: task.type } };
		task.executed = new Date();
		await task.save();
	}
}

async function executeTask(task: TaskEntity) {
	for (let execution of task.executions) {
		try {
			execution.started = new Date();
			execution = await execution.save();
			const error = await taskExecutors[task.type].execute(execution.data);

			if (error) {
				console.error('Task execution failed:', error);
				execution.error = error;
			}
		} catch (e) {
			console.error('Task execution failed:', e);
			execution.error = {
				id: 'service.messages.executeFailed',
				values: { error: e as string }
			};
		}
		execution.finished = new Date();
		await execution.save();
	}

	queuedTasks.delete(task.uuid);
	task.executed = new Date();
	await task.save();
}

if (!isMainThread) {
	parentPort?.on('close', () => {
		running = false;
	});
	run().then(() => {
		console.log('Tasks worker stopped');
	});
}
