import { redirect } from '@sveltejs/kit';
import { isJellyfinUserConnected } from '$lib/apis/jellyfin/server/jellyfin.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const isConnected = await isJellyfinUserConnected(cookies);

	if (url.pathname === '/login' && isConnected.response.ok) {
		throw redirect(301, '/');
	}
};
