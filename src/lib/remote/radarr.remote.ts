import { command, getRequestEvent, query } from '$app/server';
import * as v from 'valibot';
import { assertUserAuth } from '$lib/server/utils.server';
import { FilteringProfilesEntity, GlobalSettingsEntity } from '@reiverr/db/entities';
import { RadarrConnector } from '$lib/server/connectors/radarrConnector.server';
import { ApiSchema, type Result } from '$lib/types';
import { scheduleTask, TaskType } from '$lib/service/scheduler.server';

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
