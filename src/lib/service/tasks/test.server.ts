import type {
	TaskExecutor,
	TaskProgressCallback,
	TaskQueueCallback
} from '$lib/service/scheduler.server';
import type { MessageObject } from '$lib/types';
import * as v from 'valibot';

const TestDataSchema = v.object({
	successCount: v.pipe(v.number(), v.integer(), v.minValue(1)),
	errorCount: v.pipe(v.number(), v.integer(), v.minValue(1))
});
export type TestData = v.InferOutput<typeof TestDataSchema>;

const TestExecutionDataSchema = v.object({
	id: v.pipe(v.number(), v.integer(), v.minValue(0)),
	success: v.boolean()
});
export type TestExecutionData = v.InferOutput<typeof TestExecutionDataSchema>;

export class TestExecutor implements TaskExecutor {
	async computeDescription(data: unknown): Promise<MessageObject> {
		const testData = v.parse(TestDataSchema, data);

		console.log(
			`Queueing test with ${testData.successCount} success and ${testData.errorCount} error(s)`
		);
		if (testData.successCount + testData.errorCount == 1) {
			return { id: 'service.tasks.test.single' };
		} else {
			return {
				id: 'service.tasks.test.multiple',
				values: {
					count: testData.successCount + testData.errorCount,
					success: testData.successCount,
					error: testData.errorCount
				}
			};
		}
	}
	async computeExecutionDescription(data: unknown): Promise<MessageObject> {
		const testExecutionData = v.parse(TestExecutionDataSchema, data);

		return { id: 'service.tasks.test.execution', values: { id: testExecutionData.id } };
	}
	async queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | MessageObject> {
		const testData = v.parse(TestDataSchema, data);

		for (let i = 0; i < testData.successCount; i++) {
			await queue({ id: i, success: true });
		}

		for (let i = 0; i < testData.errorCount; i++) {
			await queue({ id: i + testData.successCount, success: false });
		}
	}
	async execute(data: unknown, progress: TaskProgressCallback): Promise<void | MessageObject> {
		/*console.log(`Executing test #${data.id}`);
		if (data.success) {
			for (let i = 0; i < 100; i++) {
				await new Promise((resolve) => setTimeout(resolve, 100));
				await progress(i, 100);
			}
		} else {
			return { id: 'service.tasks.test.error', values: { id: data.id } };
		}*/
	}
}
