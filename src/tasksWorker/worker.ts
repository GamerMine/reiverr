import { isMainThread, parentPort, workerData } from 'node:worker_threads';
import { TaskEntity, TaskExecutionEntity } from '@reiverr/db/entities';
import { taskExecutors } from './scheduler.server.ts';
import TypeOrm from '@reiverr/db';

let queuedTasks: string[] = [];
let running = true;

if (!isMainThread) {
	parentPort?.on('message', (msg) => {
		switch (msg.type) {
			case 'newTask':
				queuedTasks.unshift(msg.uuid);
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
			console.log(`Executing task: ${taskExecution.task.type}`);
			const msg = await taskExecutors[taskExecution.task.type].execute(
				taskExecution.data,
				async (current, total) => {
					console.log(`Task execution progress: ${current}/${total}`);
				}
			);
			taskExecution.finished = new Date();
			await taskExecution.save();

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
