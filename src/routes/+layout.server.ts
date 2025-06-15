import { Settings } from '$lib/entities/Settings.server';
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { isJellyfinUserConnected } from '$lib/apis/jellyfin/server/jellyfin.server';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	cookies.delete('access_token', { path: '/' });
	const settings = await Settings.getClient();
	const isConnected = await isJellyfinUserConnected(cookies);

	if (!['login', '/setup'].includes(url.pathname) && !(await Settings.getJellyfinApiKey())) {
		throw redirect(301, '/setup');
	} else if (!['login', '/setup'].includes(url.pathname) && isConnected.status !== 200) {
		throw redirect(301, '/login');
	}

	return {
		settings
	};
};
