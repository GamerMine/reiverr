import { GlobalSettingsEntity } from '@reiverr/db/entities';
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { UserSettingsEntity } from '@reiverr/db/entities';
import { defaultGlobalSettings, defaultUserSettings, type Settings } from '@reiverr/db/types';
import { assertUserAuth } from '$lib/server/utils.server.ts';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const { userId } = await assertUserAuth(cookies);
	const globalSettings = await GlobalSettingsEntity.getClient();
	const userSettings = userId ? await UserSettingsEntity.getUserSettings(userId) : undefined;
	const settings: Settings = userSettings
		? { userSettings, globalSettings }
		: { userSettings: defaultUserSettings, globalSettings: defaultGlobalSettings };

	if (!['/setup'].includes(url.pathname) && (await GlobalSettingsEntity.find()).length === 0) {
		throw redirect(301, '/setup');
	} else if (!['/login', '/setup'].includes(url.pathname) && !userId) {
		throw redirect(301, '/login');
	}

	return {
		settings,
		error: undefined
	};
};
