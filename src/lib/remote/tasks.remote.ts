import { getRequestEvent, query } from '$app/server';
import { TaskEntity } from '@reiverr/db/entities';
import * as v from 'valibot';

export const getQueuedTasks = query.live(v.optional(v.boolean()), async function* (all) {
	const {
		locals: { user }
	} = getRequestEvent();

	if (!user.userId) return { success: false, error: 'general.connectionRequired' };
	while (true) {
		yield TaskEntity.toFormatted(await TaskEntity.getPending(!all ? user.userId : undefined));
		await new Promise((f) => setTimeout(f, 500));
	}
});

export const getCompletedTasks = query.live(v.optional(v.boolean()), async function* (all) {
	const {
		locals: { user }
	} = getRequestEvent();

	if (!user.userId) return { success: false, error: 'general.connectionRequired' };
	while (true) {
		yield TaskEntity.toFormatted(await TaskEntity.getCompleted(!all ? user.userId : undefined));
		await new Promise((f) => setTimeout(f, 1000));
	}
});
