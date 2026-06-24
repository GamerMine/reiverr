import { command, getRequestEvent, query } from '$app/server';
import { assertUserAuth } from '$lib/server/utils.server';
import * as v from 'valibot';
import Connectors from '@reiverr/connectors';
import type { RemoteQueryFunction } from '@sveltejs/kit';
import type { Result } from '$lib/types.ts';
import type { JellyfinBaseItemDto } from '@reiverr/connectors/types/jellyfin';

export const jellyfinGetItems: RemoteQueryFunction<void, Result<JellyfinBaseItemDto[]>> = query(
	async () => {
		const { cookies } = getRequestEvent();
		const userId = await assertUserAuth(cookies);
		if (!userId) return { success: false, error: 'general.connectionRequired' };
		const conn = (await Connectors.getInstance()).jellyfinConnector;

		const items = await conn.getItems(userId, true, ['Movie', 'Series']);
		if (!items.response.ok) console.error(JSON.stringify(items.error, null, 2));

		return {
			success: true,
			data: items.data?.Items
		};
	}
);

export const jellyfinGetEpisodes: RemoteQueryFunction<void, Result<JellyfinBaseItemDto[]>> = query(
	async () => {
		const { cookies } = getRequestEvent();
		const userId = await assertUserAuth(cookies);
		if (!userId) return { success: false, error: 'general.connectionRequired' };
		const conn = (await Connectors.getInstance()).jellyfinConnector;

		const items = await conn.getItems(userId, undefined, ['Series', 'Episode']);
		if (!items.response.ok) console.error(JSON.stringify(items.error, null, 2));

		return {
			success: true,
			data: items.data.Items
		};
	}
);

export const jellyfinGetUserImage = query(v.string(), async (userId) => {
	const conn = (await Connectors.getInstance()).jellyfinConnector;

	const image = await conn.getUserImage(userId);
	if (!image.response.ok) console.error(JSON.stringify(image.error, null, 2));

	return {
		success: image.response.ok,
		data: image.data
			? Buffer.from(await image.data.arrayBuffer()).toString('base64')
			: undefined
	};
});

export const jellyfinGetUsers = query(async () => {
	const conn = (await Connectors.getInstance()).jellyfinConnector;
	const users = await conn.getUsers();
	if (!users.response.ok) console.error(JSON.stringify(users.error, null, 2));

	return {
		success: users.response.ok,
		data: users.data
	};
});

export const jellyfinSetItemWatched = command(
	v.object({ id: v.string(), watched: v.boolean() }),
	async (item) => {
		const { cookies } = getRequestEvent();
		const userId = await assertUserAuth(cookies);
		if (!userId) return { success: false, error: 'general.connectionRequired' };
		const conn = (await Connectors.getInstance()).jellyfinConnector;

		let res;
		if (item.watched) res = await conn.postUserPlayedItems(userId, item.id);
		else res = await conn.deleteUserPlayedItems(userId, item.id);
		if (!res.response.ok) console.error(JSON.stringify(res.error, null, 2));

		return { success: res.response.ok };
	}
);

export const jellyfinDisconnect = command(async () => {
	const { cookies } = getRequestEvent();
	cookies.delete('access_token', { path: '/' });
});
