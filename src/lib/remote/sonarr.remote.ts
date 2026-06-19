import { command, getRequestEvent, query } from '$app/server';
import * as v from 'valibot';
import { ApiSchema, type Result, SeriesAddSchema } from '$lib/types';
import { FilteringProfilesEntity, GlobalSettingsEntity } from '@reiverr/db/entities';
import { assertUserAuth } from '$lib/server/utils.server';
import { scheduleTask, TaskType } from '$lib/service/scheduler.server';
import type { SonarrQueueResource } from '@reiverr/connectors/types/sonarr';
import Connectors, { SonarrConnector } from '@reiverr/connectors';

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
	if (!(await assertUserAuth(cookies)))
		return { success: false, error: 'general.connectionRequired' };

	const { sonarrConnector: conn } = await Connectors.getInstance();
	if (!conn) return { success: false };

	const series = await conn.getSeries();
	if (!series || !series.data) return { success: false };

	return { success: true, data: series.data };
});

export const sonarrAddSeries = command(SeriesAddSchema, async (series) => {
	const { cookies } = getRequestEvent();
	if (!(await assertUserAuth(cookies)))
		return { success: false, error: 'general.connectionRequired' };

	const defaultFp = await FilteringProfilesEntity.findOne({ where: { isDefault: true } });
	if (!defaultFp) return { success: false, error: 'settings.misc.noDefaultFilteringProfile' };

	await scheduleTask(TaskType.SONARR_SERIES_ADD, series);

	return { success: true };
});

export const sonarrRemoveSeries = command(v.number(), async (seriesId) => {
	const { cookies } = getRequestEvent();
	if (!(await assertUserAuth(cookies)))
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
		if (!queue || !queue.data || !queue.data.records) return { success: false };

		cachedQueue = { success: true, data: queue.data.records };
		lastFetch = now;
	}
	return cachedQueue;
}

export const sonarrGetQueue = query.live(async function* () {
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

export const sonarrGetDiskspace = query(async () => {
	const { cookies } = getRequestEvent();
	if (!(await assertUserAuth(cookies)))
		return { success: false, error: 'general.connectionRequired' };

	const { sonarrConnector: conn } = await Connectors.getInstance();
	if (!conn) return { success: false };

	const diskspace = await conn.getDiskSpace();
	if (!diskspace || !diskspace.data) return { success: false };

	return { success: true, data: diskspace.data };
});
