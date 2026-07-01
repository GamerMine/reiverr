import { getRequestEvent, query } from '$app/server';
import { TaskEntity } from '@reiverr/db/entities';
import { assertUserAuth } from '$lib/server/utils.server.ts';
import * as v from 'valibot';

export const getQueuedTasks = query.live(v.optional(v.boolean()), async function* (all) {
	const { cookies } = getRequestEvent();
	const { userId } = await assertUserAuth(cookies);
	if (!userId) return { success: false, error: 'general.connectionRequired' };
	while (true) {
		yield TaskEntity.toFormatted(await TaskEntity.getPending(!all ? userId : undefined));
		await new Promise((f) => setTimeout(f, 500));
	}
});

export const getCompletedTasks = query.live(v.optional(v.boolean()), async function* (all) {
	const { cookies } = getRequestEvent();
	const { userId } = await assertUserAuth(cookies);
	if (!userId) return { success: false, error: 'general.connectionRequired' };
	while (true) {
		yield TaskEntity.toFormatted(await TaskEntity.getCompleted(!all ? userId : undefined));
		await new Promise((f) => setTimeout(f, 1000));
	}
});
