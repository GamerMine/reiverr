import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { isJellyfinUserConnected } from '$lib/apis/jellyfin/server/jellyfin.server';
import { UserSettingsEntity } from '$lib/entities/UserSettings.server';
import type { Settings } from '$lib/entities/Types';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	//cookies.delete('access_token', { path: '/' });
	const isConnected = await isJellyfinUserConnected(cookies);
	const globalSettings = await GlobalSettingsEntity.getClient();
	const userSettings =
		isConnected.status === 200
			? await UserSettingsEntity.getUserSettings((await isConnected.json()).Id)
			: undefined;
	const settings: Settings | undefined = userSettings
		? { userSettings, globalSettings }
		: undefined;

	if (!['/setup'].includes(url.pathname) && !(await GlobalSettingsEntity.getJellyfinApiKey())) {
		throw redirect(301, '/setup');
	} else if (!['/login', '/setup'].includes(url.pathname) && isConnected.status !== 200) {
		throw redirect(301, '/login');
	}

	return {
		settings
	};
};
