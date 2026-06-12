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
		isConnected.response.ok && isConnected.data?.Id
			? await UserSettingsEntity.getUserSettings(isConnected.data.Id)
			: undefined;
	const settings: Settings = userSettings
		? { userSettings, globalSettings }
		: { userSettings: defaultUserSettings, globalSettings: defaultGlobalSettings };

	if (isConnected.response.statusText === 'EHOSTUNREACH') {
		return {
			settings: undefined,
			error: 'general.jellyfinUnreachable'
		};
	}

	if (!['/setup'].includes(url.pathname) && (await GlobalSettingsEntity.find()).length === 0) {
		throw redirect(301, '/setup');
	} else if (!['/login', '/setup'].includes(url.pathname) && !isConnected.response.ok) {
		throw redirect(301, '/login');
	}

	return {
		settings,
		error: undefined
	};
};
