import { isMainThread, parentPort, workerData } from 'node:worker_threads';
import { TaskEntity, TaskExecutionEntity } from '@reiverr/db/entities';
import { taskExecutors } from './scheduler.server.ts';
import TypeOrm from '@reiverr/db';
import type {
	InboundMessage,
	TaskExecutionFinishedMessage,
	TaskExecutionProgressMessage,
	TaskExecutionQueuedMessage,
	TaskExecutionStartedMessage
} from './messages.server.ts';

export const tasksWorkerFilename = import.meta.url;

let queuedTasks: string[] = [];
let running = true;

if (!isMainThread) {
	parentPort?.on('message', (msg: InboundMessage) => {
		switch (msg.type) {
			case 'newTask':
				queuedTasks.unshift(msg.uuid);
				parentPort?.postMessage({
					type: 'taskQueued',
					uuid: msg.uuid
				} as TaskExecutionQueuedMessage);
				break;
			default:
				console.log(`Not yet implemented: ${msg.type}`);
		}
	});
	parentPort?.on('close', () => {
		running = false;
	});
	run().then(() => {
		console.log('Tasks worker stopped');
	});
}
async function run() {
	TypeOrm.init(workerData);
	if (!workerData) return;
	await TypeOrm.getDb();
	console.log('Tasks worker initialized');
	while (running) {
		const taskUuid = queuedTasks.pop();
		if (taskUuid) {
			let taskExecution = await TaskExecutionEntity.findOne({
				where: { uuid: taskUuid },
				relations: { task: true }
			});
			if (!taskExecution) continue;

			taskExecution.started = new Date();
			taskExecution = await taskExecution.save();
			parentPort?.postMessage({
				type: 'taskExecutionStarted',
				uuid: taskExecution.uuid
			} as TaskExecutionStartedMessage);
			console.log(`Executing task: ${taskExecution.task.type}`);
			const msg = await taskExecutors[taskExecution.task.type].execute(
				taskExecution.data,
				async (current, total) => {
					parentPort?.postMessage({
						type: 'taskExecutionProgress',
						uuid: taskExecution.uuid,
						current,
						total
					} as TaskExecutionProgressMessage);
					console.log(`Task execution progress: ${current}/${total}`);
				}
			);
			taskExecution.finished = new Date();
			await taskExecution.save();
			parentPort?.postMessage({
				type: 'taskExecutionFinished',
				uuid: taskExecution.uuid
			} as TaskExecutionFinishedMessage);

			const task = await TaskEntity.findOne({
				where: { uuid: taskExecution.task.uuid },
				relations: { executions: true }
			});
			if (task && !task.executions.find((e) => !e.finished)) {
				task.executed = new Date();
				await task.save();
			}
		}

		await new Promise((f) => setTimeout(f, 500));
	}
}
