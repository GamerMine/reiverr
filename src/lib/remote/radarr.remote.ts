import { getRequestEvent, command, query } from '$app/server';
import * as v from 'valibot';
import { assertUserAuth } from '$lib/server/utils.server';
import { FilteringProfilesEntity, GlobalSettingsEntity } from '@reiverr/db/entities';
import { RadarrConnector } from '$lib/server/connectors/radarrConnector.server';
import { ApiSchema, type Result } from '$lib/types';

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

export const addMovieToRadarr = command(
	v.object({ tmdbId: v.number(), language: v.string() }),
	async (movie): Promise<Result<undefined>> => {
		const { cookies } = getRequestEvent();
		if (!(await assertUserAuth(cookies)))
			return { success: false, error: 'general.connectionRequired' };

		const defaultFp = await FilteringProfilesEntity.findOne({ where: { isDefault: true } });
		if (!defaultFp) return { success: false, error: 'settings.misc.noDefaultFilteringProfile' };
		// await scheduleTask(TaskType.RADARR_ADD_MOVIE);
		/*const { cookies } = getRequestEvent();
	await assertUserAuth(cookies);

	const client = await Radarr.getClient();
	const radarrRootPath = (await GlobalSettingsEntity.getClient()).radarr.rootFolderPath;
	const profile = await FilteringProfilesEntity.getDefaultProfile();

	if (!radarrRootPath) return { success: false };
	if (!profile) return { success: false };

	const { data: movie } = await client.POST('/api/v3/movie', {
		body: {
			qualityProfileId: 1,
			rootFolderPath: radarrRootPath,
			tmdbId: tmdbId,
			monitored: true
		}
	});
	if (!movie || !movie.id) return { success: false };

	return { success: true };*/
		return { success: false };
	}
);
