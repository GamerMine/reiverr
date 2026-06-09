import { query } from '$app/server';
import * as v from 'valibot';
import { ApiSchema } from '$lib/types';
import { GlobalSettingsEntity } from '@reiverr/db/entities';
import { SonarrConnector } from '$lib/server/connectors/sonarrConnector.server';

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
