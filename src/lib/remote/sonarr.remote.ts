import { command, getRequestEvent, query } from '$app/server';
import * as v from 'valibot';
import { ApiSchema } from '$lib/types';
import { FilteringProfilesEntity, GlobalSettingsEntity } from '@reiverr/db/entities';
import { SonarrConnector } from '$lib/server/connectors/sonarrConnector.server';
import { assertUserAuth } from '$lib/server/utils.server';
import { BaseSync } from '$lib/server/tasks/baseSync.server';

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

	const { sonarrConnector: conn } = await BaseSync.getInstance();
	if (!conn) return { success: false };

	const series = await conn.getSeries();
	if (!series || !series.data) return { success: false };

	return { success: true, data: series.data };
});

export const sonarrAddSeries = command(
	v.object({
		tmdbId: v.number(),
		language: v.string()
	}),
	async (series) => {
		const { cookies } = getRequestEvent();
		if (!(await assertUserAuth(cookies)))
			return { success: false, error: 'general.connectionRequired' };

		const defaultFp = await FilteringProfilesEntity.findOne({ where: { isDefault: true } });
		if (!defaultFp) return { success: false, error: 'settings.misc.noDefaultFilteringProfile' };

		/*await scheduleTask(TaskType.SONARR_SERIES_ADD)*/
	}
);
