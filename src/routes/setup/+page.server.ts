import { checkJellyfinConnection } from '$lib/apis/jellyfin/server/jellyfin.server';
import { fail, redirect } from '@sveltejs/kit';
import { GlobalSettingsEntity } from '@reiverr/db/entities';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const jellyfinAPIKey = await GlobalSettingsEntity.find();

	if (url.pathname === '/setup' && jellyfinAPIKey.length > 0) {
		throw redirect(301, '/login');
	}
};

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const baseURL = formData.get('baseURL') as string;
		const apiKey = formData.get('apiKey') as string;
		const jellyfinConnection = await checkJellyfinConnection(baseURL, apiKey);

		if (jellyfinConnection.status === 404) {
			return fail(jellyfinConnection.status, { code: 1 });
		} else if (jellyfinConnection.status === 401) {
			return fail(jellyfinConnection.status, { code: 2 });
		}

		await GlobalSettingsEntity.setJellyfinApiEndpoint(baseURL, apiKey);

		return { success: true };
	}
};
