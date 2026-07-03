import type { TaskExecutor, TaskQueueCallback } from '../scheduler.server.ts';
import * as v from 'valibot';

export const TestTaskSchema = v.object({
	failAtQueueThrow: v.optional(v.boolean(), false),
	failAtExecutionThrow: v.optional(v.boolean(), false),
	failAtQueue: v.optional(v.boolean(), false),
	failAtExecution: v.optional(v.boolean(), false)
});
export type TestTaskType = v.InferOutput<typeof TestTaskSchema>;

export class TestTask implements TaskExecutor {
	async queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | string> {
		const testData: TestTaskType = v.parse(TestTaskSchema, data);

		if (testData.failAtQueueThrow) {
			throw 'Test task failed at queue step';
		} else if (testData.failAtQueue) {
			return 'Test task failed at queue step';
		} else {
			await queue(testData);
		}
	}

	async execute(data: unknown): Promise<void | string> {
		const testData: TestTaskType = v.parse(TestTaskSchema, data);

		await new Promise((f) => setTimeout(f, 2000));
		if (testData.failAtExecutionThrow) {
			throw 'Test task failed at execution step';
		} else if (testData.failAtExecution) {
			return 'Test task failed at execution step';
		}
	}
}
