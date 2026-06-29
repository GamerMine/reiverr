import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { assertUserAuth } from '$lib/server/utils.server.ts';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const { userId } = await assertUserAuth(cookies);

	if (url.pathname === '/login' && userId) {
		throw redirect(301, '/');
	}
};
