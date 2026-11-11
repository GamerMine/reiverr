import { TaskState, type TaskStatus } from '@unifarr/db/types';

export function fillTemplate(message: string, data: unknown) {
	if (!data) return message;
	for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
		message = message.replaceAll(`{${key}}`, String(value));
	}
	return message;
}

export function taskMessageKey(task: TaskStatus) {
	return 'service.tasks.' + task.type + (task.state === TaskState.ERROR ? '.error' : '.success');
}
