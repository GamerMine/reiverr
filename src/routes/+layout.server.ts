import { GlobalSettingsEntity } from '@reiverr/db/entities';
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { isJellyfinUserConnected } from '$lib/apis/jellyfin/server/jellyfin.server';
import { UserSettingsEntity } from '@reiverr/db/entities';
import { defaultGlobalSettings, defaultUserSettings, type Settings } from '@reiverr/db/types';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const isConnected = await isJellyfinUserConnected(cookies);
	const globalSettings = await GlobalSettingsEntity.getClient();
	const userSettings =
		isConnected.status === 200
			? await UserSettingsEntity.getUserSettings((await isConnected.json()).Id)
			: undefined;
	const settings: Settings = userSettings
		? { userSettings, globalSettings }
		: { userSettings: defaultUserSettings, globalSettings: defaultGlobalSettings };

	if (isConnected.statusText === 'EHOSTUNREACH') {
		return {
			settings: undefined,
			error: 'general.jellyfinUnreachable'
		};
	}

	if (!['/setup'].includes(url.pathname) && !(await GlobalSettingsEntity.getJellyfinApiKey())) {
		throw redirect(301, '/setup');
	} else if (!['/login', '/setup'].includes(url.pathname) && isConnected.status !== 200) {
		throw redirect(301, '/login');
	}

	return {
		settings,
		error: undefined
	};
};
