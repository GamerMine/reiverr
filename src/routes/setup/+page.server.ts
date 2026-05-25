import { checkJellyfinConnection } from '$lib/apis/jellyfin/server/jellyfin.server';
import { fail, redirect } from '@sveltejs/kit';
import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';
import type { PageServerLoad } from '../../../.svelte-kit/types/src/routes/setup/$types';

export const load: PageServerLoad = async ({ url }) => {
	const jellyfinAPIKey = await GlobalSettingsEntity.getJellyfinApiKey();

	if (url.pathname === '/setup' && jellyfinAPIKey) {
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
