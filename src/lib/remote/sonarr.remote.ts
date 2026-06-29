import { command, getRequestEvent, query } from '$app/server';
import * as v from 'valibot';
import { ApiSchema, type Result } from '$lib/utils/types.ts';
import { FilteringProfilesEntity, GlobalSettingsEntity } from '@reiverr/db/entities';
import { assertUserAuth } from '$lib/server/utils.server';
import { scheduleTask } from '../../tasksWorker/scheduler.server';
import type { SonarrQueueResource } from '@reiverr/connectors/types/sonarr';
import Connectors, { SonarrConnector } from '@reiverr/connectors';
import { TaskType } from '@reiverr/db/types';
import { SeriesAddSchema } from '../../tasksWorker/types';

export const sonarrIsHealthy = query(v.optional(ApiSchema), async (api) => {
	if (api && api.url && api.key) return await new SonarrConnector(api.url, api.key).isHealthy();
	const creds = await GlobalSettingsEntity.getSonarrApi();
	return await new SonarrConnector(creds?.apiUrl ?? '', creds?.apiKey ?? '').isHealthy();
});

export const sonarrGetRootFolders = query(v.optional(ApiSchema), async (api) => {
	if (api && api.url && api.key)
		return (await new SonarrConnector(api.url, api.key).getRootFolder()).data;
	const creds = await GlobalSettingsEntity.getSonarrApi();
	return (await new SonarrConnector(creds?.apiUrl ?? '', creds?.apiKey ?? '').getRootFolder())
		.data;
});

export const sonarrGetSeries = query(async () => {
	const { cookies } = getRequestEvent();
	if (!(await assertUserAuth(cookies)).userId)
		return { success: false, error: 'general.connectionRequired' };

	const { sonarrConnector: conn } = await Connectors.getInstance();
	if (!conn) {
		console.warn('Cannot get Sonarr series: Sonarr is unavailable');
		return { success: false };
	}

	const series = await conn.getSeries();
	if (!series.response.ok) console.error(JSON.stringify(series.error, null, 2));

	return { success: series.response.ok, data: series.data };
});

export const sonarrAddSeries = command(SeriesAddSchema, async (series) => {
	const { cookies } = getRequestEvent();
	if (!(await assertUserAuth(cookies)).userId)
		return { success: false, error: 'general.connectionRequired' };

	const defaultFp = await FilteringProfilesEntity.findOne({ where: { isDefault: true } });
	if (!defaultFp) return { success: false, error: 'settings.misc.noDefaultFilteringProfile' };

	await scheduleTask(TaskType.SONARR_SERIES_ADD, series);

	return { success: true };
});

export const sonarrRemoveSeries = command(v.number(), async (seriesId) => {
	const { cookies } = getRequestEvent();
	if (!(await assertUserAuth(cookies)).userId)
		return { success: false, error: 'general.connectionRequired' };

	await scheduleTask(TaskType.SONARR_SERIES_REMOVE, seriesId);

	return { success: true };
});

let cachedQueue: Result<SonarrQueueResource[]> | undefined;
let lastFetch = 0;
async function getCachedQueue() {
	const now = Date.now();
	if (!cachedQueue || now - lastFetch > 2000) {
		const { sonarrConnector: conn } = await Connectors.getInstance();
		if (!conn) return { success: false };

		await conn.postCommand('RefreshMonitoredDownloads');

		const queue = await conn.getQueue();

		cachedQueue = { success: queue.response.ok, data: queue.data.records };
		lastFetch = now;
	}
	return cachedQueue;
}

export const sonarrGetQueue = query.live(async function* () {
	while (true) {
		const { cookies } = getRequestEvent();
		if (!(await assertUserAuth(cookies)).userId) {
			yield { success: false, error: 'general.connectionRequired' };
			await new Promise((f) => setTimeout(f, 2000));
			continue;
		}

		yield await getCachedQueue();
		await new Promise((f) => setTimeout(f, 2000));
	}
});

export const sonarrGetDiskspace = query(async () => {
	const { cookies } = getRequestEvent();
	if (!(await assertUserAuth(cookies)).userId)
		return { success: false, error: 'general.connectionRequired' };

	const { sonarrConnector: conn } = await Connectors.getInstance();
	if (!conn) {
		console.warn('Cannot get Sonarr diskspace: Sonarr is unavailable');
		return { success: false };
	}

	const diskspace = await conn.getDiskSpace();
	if (!diskspace.response.ok) console.error(JSON.stringify(diskspace.error, null, 2));

	return { success: diskspace.response.ok, data: diskspace.data };
});
