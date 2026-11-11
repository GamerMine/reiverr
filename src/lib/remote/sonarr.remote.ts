import { getRequestEvent } from '$app/server';
import {
	adminQuery,
	protectedCommand,
	protectedQuery,
	protectedQueryLive
} from '#lib/server/auth/remote-guards.ts';
import * as v from 'valibot';
import { type Result } from '#lib/utils/types.ts';
import { FilteringProfilesEntity, GlobalSettingsEntity } from '@unifarr/db/entities';
import { scheduleTask } from '../../tasksWorker/scheduler.server';
import type { SonarrQueueResource } from '@unifarr/connectors/types/sonarr';
import Connectors, { SonarrConnector } from '@unifarr/connectors';
import { TaskType } from '@unifarr/db/types';
import { SeriesAddSchema, SeriesRemoveSchema } from '../../tasksWorker/types';
import Logger, { LogLevel } from '@unifarr/logging';
import { ApiSchema } from '#lib/utils/schemas.ts';

const logger = Logger.getLogger('SonarrRemote');

export const sonarrIsHealthy = adminQuery(v.optional(ApiSchema), async (api) => {
	if (api && api.url && api.key) return await new SonarrConnector(api.url, api.key).isHealthy();
	const creds = await GlobalSettingsEntity.getSonarrApi();
	return await new SonarrConnector(creds?.apiUrl ?? '', creds?.apiKey ?? '').isHealthy();
});

export const sonarrGetRootFolders = adminQuery(v.optional(ApiSchema), async (api) => {
	if (api && api.url && api.key)
		return (await new SonarrConnector(api.url, api.key).getRootFolder()).data;
	const creds = await GlobalSettingsEntity.getSonarrApi();
	return (await new SonarrConnector(creds?.apiUrl ?? '', creds?.apiKey ?? '').getRootFolder())
		.data;
});

export const sonarrGetSeries = protectedQuery(async () => {
	const { sonarrConnector: conn } = await Connectors.getInstance();
	if (!conn) {
		logger.log(LogLevel.WARNING, 'Cannot get Sonarr series: Sonarr is unavailable');
		return { success: false };
	}

	const series = await conn.getSeries();
	if (!series.response.ok) logger.log(LogLevel.ERROR, JSON.stringify(series.error, null, 2));

	return { success: series.response.ok, data: series.data };
});

export const sonarrAddSeries = protectedCommand(SeriesAddSchema, async (series) => {
	const {
		locals: {
			user: { userId }
		}
	} = getRequestEvent();

	const defaultFp = await FilteringProfilesEntity.findOne({ where: { isDefault: true } });
	if (!defaultFp) return { success: false, error: 'settings.misc.noDefaultFilteringProfile' };

	await scheduleTask(userId!, TaskType.SONARR_SERIES_ADD, series);

	return { success: true };
});

export const sonarrRemoveSeries = protectedCommand(SeriesRemoveSchema, async (seriesId) => {
	const {
		locals: {
			user: { userId }
		}
	} = getRequestEvent();

	await scheduleTask(userId!, TaskType.SONARR_SERIES_REMOVE, seriesId);

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

export const sonarrGetQueue = protectedQueryLive(async function* () {
	while (true) {
		yield await getCachedQueue();
		await new Promise((f) => setTimeout(f, 2000));
	}
});

export const sonarrGetDiskspace = protectedQuery(async () => {
	const { sonarrConnector: conn } = await Connectors.getInstance();
	if (!conn) {
		logger.log(LogLevel.WARNING, 'Cannot get Sonarr diskspace: Sonarr is unavailable');
		return { success: false };
	}

	const diskspace = await conn.getDiskSpace();
	if (!diskspace.response.ok)
		logger.log(LogLevel.ERROR, JSON.stringify(diskspace.error, null, 2));

	return { success: diskspace.response.ok, data: diskspace.data };
});
