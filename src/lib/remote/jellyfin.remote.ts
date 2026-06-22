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

		return {
			success: true,
			data: (
				await (
					await Connectors.getInstance()
				).jellyfinConnector.getItems(userId, true, ['Movie', 'Series'])
			).data?.Items
		};
	}
);

export const jellyfinGetEpisodes: RemoteQueryFunction<void, Result<JellyfinBaseItemDto[]>> = query(
	async () => {
		const { cookies } = getRequestEvent();
		const userId = await assertUserAuth(cookies);
		if (!userId) return { success: false, error: 'general.connectionRequired' };

		return {
			success: true,
			data: (
				await (
					await Connectors.getInstance()
				).jellyfinConnector.getItems(userId, undefined, ['Series', 'Episode'])
			).data?.Items
		};
	}
);

export const jellyfinGetUserImage = query(v.string(), async (userId) => {
	const conn = (await Connectors.getInstance()).jellyfinConnector;

	const image = await conn.getUserImage(userId);
	return {
		success: image.response.ok,
		data: image.data
			? Buffer.from(await image.data.arrayBuffer()).toString('base64')
			: undefined,
		error: image.response.ok ? undefined : image.response.statusText
	};
});

export const jellyfinGetUsers = query(async () => {
	const conn = (await Connectors.getInstance()).jellyfinConnector;
	const users = await conn.getUsers();

	return {
		success: users.response.ok,
		data: users.data,
		error: users.response.ok ? undefined : users.response.statusText
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

		return {
			success: res.response.ok,
			error: res.response.ok ? undefined : res.response.statusText
		};
	}
);

export const jellyfinDisconnect = command(async () => {
	const { cookies } = getRequestEvent();
	cookies.delete('access_token', { path: '/' });
});
