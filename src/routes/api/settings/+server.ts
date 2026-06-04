import { type RequestHandler } from '@sveltejs/kit';
import { isJellyfinUserConnected } from '$lib/apis/jellyfin/server/jellyfin.server';
import type { JellyfinUser } from '$lib/apis/jellyfin/jellyfinApi';
import { GlobalSettingsEntity } from '@reiverr/db/entities';
import { defaultGlobalSettings } from '@reiverr/db/types';

export const DELETE: RequestHandler = async ({ cookies, url }) => {
	const userReq = await isJellyfinUserConnected(cookies);
	if (userReq.status !== 200) {
		return new Response(JSON.stringify({}), {
			status: 401
		});
	}
	const user: JellyfinUser = await userReq.json();

	if (user.Policy && user.Policy.IsAdministrator) {
		const integration = url.searchParams.get('integration');

		if (integration) {
			switch (integration) {
				case 'radarr': {
					await GlobalSettingsEntity.setRadarrApiEndpoint(undefined, undefined);
					await GlobalSettingsEntity.setRadarrApiConfiguration(undefined, undefined);
					break;
				}
				case 'sonarr': {
					await GlobalSettingsEntity.setSonarrApiEndpoint(undefined, undefined);
					await GlobalSettingsEntity.setSonarrApiConfiguration(
						undefined,
						undefined,
						defaultGlobalSettings.sonarr.startSearch
					);
					break;
				}
			}
		}

		return new Response(JSON.stringify({}), {
			status: 200
		});
	} else {
		return new Response(JSON.stringify({}), {
			status: 401
		});
	}
};
