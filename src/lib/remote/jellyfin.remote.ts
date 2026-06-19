import { command, getRequestEvent, query } from '$app/server';
import { assertUserAuth } from '$lib/server/utils.server';
import { BaseSync } from '$lib/server/tasks/baseSync.server';
import * as v from 'valibot';

export const jellyfinGetItems = query(async () => {
	const { cookies } = getRequestEvent();
	const userId = await assertUserAuth(cookies);
	if (!userId) return { success: false, error: 'general.connectionRequired' };

	return {
		success: true,
		data: (
			await (
				await BaseSync.getInstance()
			).jellyfinConnector.getItems(userId, true, ['Movie', 'Series'])
		).data?.Items
	};
});

export const jellyfinGetEpisodes = query(async () => {
	const { cookies } = getRequestEvent();
	const userId = await assertUserAuth(cookies);
	if (!userId) return { success: false, error: 'general.connectionRequired' };

	return {
		success: true,
		data: (
			await (
				await BaseSync.getInstance()
			).jellyfinConnector.getItems(userId, undefined, ['Series', 'Episode'])
		).data?.Items
	};
});

export const jellyfinSetItemWatched = command(
	v.object({ id: v.string(), watched: v.boolean() }),
	async (item) => {
		const { cookies } = getRequestEvent();
		const userId = await assertUserAuth(cookies);
		if (!userId) return { success: false, error: 'general.connectionRequired' };
		const conn = (await BaseSync.getInstance()).jellyfinConnector;

		let res;
		if (item.watched) res = await conn.postUserPlayedItems(userId, item.id);
		else res = await conn.deleteUserPlayedItems(userId, item.id);

		return {
			success: res.response.ok,
			error: res.response.ok ? undefined : res.response.statusText
		};
	}
);

export const jellyfinGetUserImage = query(v.string(), async (userId) => {
	const conn = (await BaseSync.getInstance()).jellyfinConnector;

	const image = await conn.getUserImage(userId);
	return {
		success: image.response.ok,
		data: image.data
			? Buffer.from(await image.data.arrayBuffer()).toString('base64')
			: undefined,
		error: image.response.ok ? undefined : image.response.statusText
	};
});
