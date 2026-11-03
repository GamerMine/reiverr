import { GlobalSettingsEntity } from '@reiverr/db/entities';
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { UserSettingsEntity } from '@reiverr/db/entities';
import { defaultGlobalSettings, defaultUserSettings, type Settings } from '@reiverr/db/types';

export const load: LayoutServerLoad = async ({
	cookies,
	url,
	locals: {
		user: { userId, isOidc }
	}
}) => {
	if (url.pathname.startsWith('/setup')) {
		return {
			settings: { userSettings: defaultUserSettings, globalSettings: defaultGlobalSettings },
			error: undefined
		};
	} else {
		if ((await GlobalSettingsEntity.find()).length === 0) throw redirect(301, '/setup');
	}

	const globalSettings = await GlobalSettingsEntity.getClient();
	const userSettings = await UserSettingsEntity.getUserSettings(userId);
	const settings: Settings = userSettings
		? { userSettings, globalSettings }
		: { userSettings: defaultUserSettings, globalSettings: defaultGlobalSettings };

	return {
		settings,
		isOidc,
		error: undefined
	};
};
