import { command, getRequestEvent, query } from '$app/server';
import * as v from 'valibot';
import { assertUserAuth } from '$lib/server/utils.server';
import { FilteringProfilesEntity, GlobalSettingsEntity } from '@reiverr/db/entities';
import { ApiSchema, type Result } from '$lib/types';
import { scheduleTask } from '../../tasksWorker/scheduler.server';
import type { RadarrQueueResource } from '@reiverr/connectors/types/radarr';
import Connectors, { RadarrConnector } from '@reiverr/connectors';
import { TaskType } from '@reiverr/db/types';

export const radarrIsHealthy = query(v.optional(ApiSchema), async (api) => {
	if (api && api.url && api.key) return await new RadarrConnector(api.url, api.key).isHealthy();
	const creds = await GlobalSettingsEntity.getRadarrApi();
	return await new RadarrConnector(creds?.apiUrl ?? '', creds?.apiKey ?? '').isHealthy();
});

export const radarrGetRootFolders = query(v.optional(ApiSchema), async (api) => {
	if (api && api.url && api.key)
		return (await new RadarrConnector(api.url, api.key).getRootFolder()).data;
	const creds = await GlobalSettingsEntity.getRadarrApi();
	return (await new RadarrConnector(creds?.apiUrl ?? '', creds?.apiKey ?? '').getRootFolder())
		.data;
});

let cachedQueue: Result<RadarrQueueResource[]> | undefined;
let lastFetch = 0;

async function getCachedQueue() {
	const now = Date.now();
	if (!cachedQueue || now - lastFetch > 2000) {
		const { radarrConnector: conn } = await Connectors.getInstance();
		if (!conn) return { success: false };

		await conn.postCommand('RefreshMonitoredDownloads');

		const queue = await conn.getQueue();
		if (!queue || !queue.data || !queue.data.records) return { success: false };

		cachedQueue = { success: true, data: queue.data.records };
		lastFetch = now;
	}
	return cachedQueue;
}

export const radarrGetQueue = query.live(async function* () {
	while (true) {
		const { cookies } = getRequestEvent();
		if (!(await assertUserAuth(cookies))) {
			yield { success: false, error: 'general.connectionRequired' };
			await new Promise((f) => setTimeout(f, 2000));
			continue;
		}

		yield await getCachedQueue();
		await new Promise((f) => setTimeout(f, 2000));
	}
});

export const radarrGetMovies = query(async () => {
	const { cookies } = getRequestEvent();
	if (!(await assertUserAuth(cookies)))
		return { success: false, error: 'general.connectionRequired' };

	const { radarrConnector: conn } = await Connectors.getInstance();
	if (!conn) return { success: false };

	const movies = await conn.getMovie();
	if (!movies || !movies.data) return { success: false };

	return { success: true, data: movies.data };
});

export const radarrAddMovie = command(
	v.object({ tmdbId: v.number(), language: v.string() }),
	async (movie): Promise<Result<undefined>> => {
		const { cookies } = getRequestEvent();
		if (!(await assertUserAuth(cookies)))
			return { success: false, error: 'general.connectionRequired' };

		const defaultFp = await FilteringProfilesEntity.findOne({ where: { isDefault: true } });
		if (!defaultFp) return { success: false, error: 'settings.misc.noDefaultFilteringProfile' };

		await scheduleTask(TaskType.RADARR_MOVIE_ADD, movie);

		return { success: true };
	}
);

export const radarrRemoveMovie = command(v.number(), async (id: number) => {
	const { cookies } = getRequestEvent();
	if (!(await assertUserAuth(cookies)))
		return { success: false, error: 'general.connectionRequired' };

	await scheduleTask(TaskType.RADARR_MOVIE_REMOVE, id);

	return { success: true };
});

export const radarrGetDiskspace = query(async () => {
	const { cookies } = getRequestEvent();
	if (!(await assertUserAuth(cookies)))
		return { success: false, error: 'general.connectionRequired' };

	const { radarrConnector: conn } = await Connectors.getInstance();
	if (!conn) return { success: false };

	const diskspace = await conn.getDiskSpace();
	if (!diskspace || !diskspace.data) return { success: false };

	return { success: true, data: diskspace.data };
});
