import { getRequestEvent } from '$app/server';
import { protectedQueryLive } from '#lib/server/auth/remote-guards.ts';
import { TaskEntity } from '@unifarr/db/entities';
import * as v from 'valibot';

export const getQueuedTasks = protectedQueryLive(v.optional(v.boolean()), async function* (all) {
	const {
		locals: {
			user: { userId }
		}
	} = getRequestEvent();

	while (true) {
		yield TaskEntity.toFormatted(await TaskEntity.getPending(!all ? userId! : undefined));
		await new Promise((f) => setTimeout(f, 500));
	}
});

export const getCompletedTasks = protectedQueryLive(v.optional(v.boolean()), async function* (all) {
	const {
		locals: {
			user: { userId }
		}
	} = getRequestEvent();

	while (true) {
		yield TaskEntity.toFormatted(await TaskEntity.getCompleted(!all ? userId! : undefined));
		await new Promise((f) => setTimeout(f, 1000));
	}
});
