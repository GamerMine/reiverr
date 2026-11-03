import { command, getRequestEvent, query, type RemoteQueryFunction } from '$app/server';
import { logoutUser } from '#lib/server/auth/auth.js';
import * as v from 'valibot';
import Connectors, { JellyfinConnector } from '@reiverr/connectors';
import { type Result } from '#lib/utils/types.ts';
import type { JellyfinBaseItemDto } from '@reiverr/connectors/types/jellyfin';
import { JellyfinDeviceProfileSchema } from '#lib/components/player/playback-profiles/index.js';
import { GlobalSettingsEntity } from '@reiverr/db/entities';
import Logger, { LogLevel } from '@reiverr/logging';
import { ApiSchema } from '#lib/utils/schemas.ts';

const logger = Logger.getLogger('JellyfinRemote');

export const jellyfinIsHealthy = query(v.optional(ApiSchema), async (api) => {
	if (api?.url && api.key) return await new JellyfinConnector(api.url, api.key).isHealthy();
	const creds = await GlobalSettingsEntity.getJellyfinApi();
	return await new JellyfinConnector(creds.apiUrl ?? '', creds.apiKey ?? '').isHealthy();
});

export const jellyfinGetItems: RemoteQueryFunction<void, Result<JellyfinBaseItemDto[]>> = query(
	async () => {
		const {
			locals: { user }
		} = getRequestEvent();

		const conn = (await Connectors.getInstance()).jellyfinConnector;

		const items = await conn.getItems(user.userId, true, ['Movie', 'Series']);
		if (!items.response.ok) logger.log(LogLevel.ERROR, JSON.stringify(items.error, null, 2));

		return {
			success: true,
			data: items.data?.Items
		};
	}
);

export const jellyfinGetItemById = query(v.string(), async (itemId) => {
	const {
		locals: { user }
	} = getRequestEvent();

	if (!user.userId) return { success: false, error: 'general.connectionRequired' };
	const conn = (await Connectors.getInstance()).jellyfinConnector;

	const item = await conn.getItemById(user.userId, itemId);

	if (!item.response.ok)
		logger.log(
			LogLevel.ERROR,
			`${item.response.status} ${item.response.statusText} ${JSON.stringify(item.error, null, 2)}`
		);

	return { success: item.response.ok, data: item.data };
});

export const jellyfinGetEpisodes: RemoteQueryFunction<void, Result<JellyfinBaseItemDto[]>> = query(
	async () => {
		const {
			locals: { user }
		} = getRequestEvent();

		const conn = (await Connectors.getInstance()).jellyfinConnector;

		const items = await conn.getItems(user.userId, undefined, ['Series', 'Episode']);
		if (!items.response.ok) logger.log(LogLevel.ERROR, JSON.stringify(items.error, null, 2));

		return {
			success: items.response.ok,
			data: items.data.Items
		};
	}
);

export const jellyfinGetUserImage = query(v.string(), async (userId) => {
	const conn = (await Connectors.getInstance()).jellyfinConnector;

	const image = await conn.getUserImage(userId);
	if (!image.response.ok) logger.log(LogLevel.ERROR, JSON.stringify(image.error, null, 2));

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
	if (!users.response.ok) logger.log(LogLevel.ERROR, JSON.stringify(users.error, null, 2));

	return {
		success: users.response.ok,
		data: users.data
	};
});

export const jellyfinGetNextUp: RemoteQueryFunction<void, Result<JellyfinBaseItemDto[]>> = query(
	async () => {
		const {
			locals: { user }
		} = getRequestEvent();

		const conn = (await Connectors.getInstance()).jellyfinConnector;

		const items = await conn.getShowsNextUp(user.userId);
		if (!items.response.ok) logger.log(LogLevel.ERROR, JSON.stringify(items.error, null, 2));

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
	const {
		locals: { user }
	} = getRequestEvent();

	const conn = (await Connectors.getInstance()).jellyfinConnector;

	const items = await conn.getUserItemsResume(user.userId);
	if (!items.response.ok) logger.log(LogLevel.ERROR, JSON.stringify(items.error, null, 2));

	return {
		success: items.response.ok,
		data: items.data.Items
	};
});

export const jellyfinSetItemWatched = command(
	v.object({ id: v.string(), watched: v.boolean() }),
	async (item) => {
		const {
			locals: { user }
		} = getRequestEvent();

		const conn = (await Connectors.getInstance()).jellyfinConnector;

		let res;
		if (item.watched) res = await conn.postUserPlayedItems(user.userId, item.id);
		else res = await conn.deleteUserPlayedItems(user.userId, item.id);
		if (!res.response.ok) logger.log(LogLevel.ERROR, JSON.stringify(res.error, null, 2));

		return { success: res.response.ok };
	}
);

export const jellyfinUpdateProgress = command(
	v.object({
		itemId: v.string(),
		positionTicks: v.number()
	}),
	async (data) => {
		const {
			locals: { user }
		} = getRequestEvent();

		const conn = (await Connectors.getInstance()).jellyfinConnector;

		const res = await conn.postUserItemsByIdUserData(
			user.userId,
			data.itemId,
			data.positionTicks
		);
		if (!res.response.ok) logger.log(LogLevel.ERROR, JSON.stringify(res.error, null, 2));

		return { success: res.response.ok };
	}
);

export const jellyfinDeleteActiveEncoding = command(v.string(), async (playSessionId) => {
	const {
		locals: { user }
	} = getRequestEvent();

	const conn = (await Connectors.getInstance()).jellyfinConnector;

	const res = await conn.deleteVideosActiveEncodings(user.username, playSessionId);
	if (!res.response.ok) logger.log(LogLevel.ERROR, JSON.stringify(res.error, null, 2));

	return { success: res.response.ok };
});

export const jellyfinGetPlaySession = command(
	v.object({
		itemId: v.string(),
		deviceProfile: JellyfinDeviceProfileSchema,
		startTimeTicks: v.number(),
		maxStreamingBitrate: v.number()
	}),
	async (data) => {
		const {
			locals: { user }
		} = getRequestEvent();

		const conn = (await Connectors.getInstance()).jellyfinConnector;
		const session = await conn.postItemsByIdPlaybackInfo(
			user.userId,
			data.itemId,
			data.maxStreamingBitrate,
			data.startTimeTicks,
			data.deviceProfile
		);

		if (!session.response.ok)
			logger.log(LogLevel.ERROR, JSON.stringify(session.error, null, 2));

		const mediaSource = session.data?.MediaSources?.[0];
		return {
			success: session.response.ok,
			data: {
				playbackUri:
					mediaSource?.TranscodingUrl ||
					`/Videos/${mediaSource.Id}/stream.mp4?Static=true&mediaSourceId=${
						mediaSource.Id
					}&Tag=${mediaSource.ETag}`,
				mediaSourceId: mediaSource?.Id,
				playSessionId: session.data?.PlaySessionId,
				directPlay: !!mediaSource?.SupportsDirectPlay || !!mediaSource?.SupportsDirectStream
			}
		};
	}
);
