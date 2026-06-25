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
		const { userId } = await assertUserAuth(cookies);
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

export const jellyfinGetItemById = query(v.string(), async (itemId) => {
	const { cookies } = getRequestEvent();
	const { userId } = await assertUserAuth(cookies);
	if (!userId) return { success: false, error: 'general.connectionRequired' };
	const conn = (await Connectors.getInstance()).jellyfinConnector;

	const item = await conn.getItemById(userId, itemId);
	if (!item.response.ok)
		console.error(
			`Error code ${item.response.status} ${item.response.statusText}`,
			JSON.stringify(item.error, null, 2)
		);

	return {
		success: item.response.ok,
		data: item.data
	};
});

export const jellyfinGetEpisodes: RemoteQueryFunction<void, Result<JellyfinBaseItemDto[]>> = query(
	async () => {
		const { cookies } = getRequestEvent();
		const { userId } = await assertUserAuth(cookies);
		if (!userId) return { success: false, error: 'general.connectionRequired' };
		const conn = (await Connectors.getInstance()).jellyfinConnector;

		const items = await conn.getItems(userId, undefined, ['Series', 'Episode']);
		if (!items.response.ok) console.error(JSON.stringify(items.error, null, 2));

		return {
			success: items.response.ok,
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

export const jellyfinGetNextUp: RemoteQueryFunction<void, Result<JellyfinBaseItemDto[]>> = query(
	async () => {
		const { cookies } = getRequestEvent();
		const { userId } = await assertUserAuth(cookies);
		if (!userId) return { success: false, error: 'general.connectionRequired' };
		const conn = (await Connectors.getInstance()).jellyfinConnector;

		const items = await conn.getShowsNextUp(userId);
		if (!items.response.ok) console.error(JSON.stringify(items.error, null, 2), 'COUCOU2');

		return {
			success: items.response.ok,
			data: items.data.Items
		};
	}
);

export const jellyfinGetContinueWatching: RemoteQueryFunction<
	void,
	Result<JellyfinBaseItemDto[]>
> = query(async () => {
	const { cookies } = getRequestEvent();
	const { userId } = await assertUserAuth(cookies);
	if (!userId) return { success: false, error: 'general.connectionRequired' };
	const conn = (await Connectors.getInstance()).jellyfinConnector;

	const items = await conn.getUserItemsResume(userId);
	if (!items.response.ok) console.error(JSON.stringify(items.error, null, 2), 'COUCOU');

	return {
		success: items.response.ok,
		data: items.data.Items
	};
});

export const jellyfinSetItemWatched = command(
	v.object({ id: v.string(), watched: v.boolean() }),
	async (item) => {
		const { cookies } = getRequestEvent();
		const { userId } = await assertUserAuth(cookies);
		if (!userId) return { success: false, error: 'general.connectionRequired' };
		const conn = (await Connectors.getInstance()).jellyfinConnector;

		let res;
		if (item.watched) res = await conn.postUserPlayedItems(userId, item.id);
		else res = await conn.deleteUserPlayedItems(userId, item.id);
		if (!res.response.ok) console.error(JSON.stringify(res.error, null, 2));

		return { success: res.response.ok };
	}
);

export const jellyfinReportPlaybackStarted = command(
	v.object({ itemId: v.string(), playSessionId: v.string(), mediaSourceId: v.string() }),
	async (data) => {
		const { cookies } = getRequestEvent();
		const { userId } = await assertUserAuth(cookies);
		if (!userId) return { success: false, error: 'general.connectionRequired' };
		const conn = (await Connectors.getInstance()).jellyfinConnector;

		const res = await conn.postSessionsPlaying(
			data.itemId,
			data.playSessionId,
			data.mediaSourceId
		);
		if (!res.response.ok) console.error(JSON.stringify(res.error, null, 2));

		return { success: res.response.ok };
	}
);

export const jellyfinReportPlaybackProgress = command(
	v.object({
		itemId: v.string(),
		playSessionId: v.string(),
		isPaused: v.boolean(),
		positionTicks: v.number()
	}),
	async (data) => {
		const { cookies } = getRequestEvent();
		const { userId } = await assertUserAuth(cookies);
		if (!userId) return { success: false, error: 'general.connectionRequired' };
		const conn = (await Connectors.getInstance()).jellyfinConnector;

		const res = await conn.postSessionsPlayingProgress(
			data.itemId,
			data.playSessionId,
			data.itemId,
			data.isPaused,
			data.positionTicks
		);
		if (!res.response.ok) console.error(JSON.stringify(res.error, null, 2));

		return { success: res.response.ok };
	}
);

export const jellyfinReportPlaybackStopped = command(
	v.object({ itemId: v.string(), playSessionId: v.string(), positionTicks: v.number() }),
	async (data) => {
		const { cookies } = getRequestEvent();
		const { userId } = await assertUserAuth(cookies);
		if (!userId) return { success: false, error: 'general.connectionRequired' };
		const conn = (await Connectors.getInstance()).jellyfinConnector;

		const res = await conn.postSessionsPlayingStopped(
			data.itemId,
			data.playSessionId,
			data.itemId,
			data.positionTicks
		);
		if (!res.response.ok) console.error(JSON.stringify(res.error, null, 2));

		return { success: res.response.ok };
	}
);

export const jellyfinDeleteActiveEncoding = command(v.string(), async (playSessionId) => {
	const { cookies } = getRequestEvent();
	const { username } = await assertUserAuth(cookies);
	if (!username) return { success: false, error: 'general.connectionRequired' };
	const conn = (await Connectors.getInstance()).jellyfinConnector;

	const res = await conn.deleteVideosActiveEncodings(username, playSessionId);
	if (!res.response.ok) console.error(JSON.stringify(res.error, null, 2));

	return { success: res.response.ok };
});

export const jellyfinDisconnect = command(async () => {
	const { cookies } = getRequestEvent();
	cookies.delete('access_token', { path: '/' });
});
