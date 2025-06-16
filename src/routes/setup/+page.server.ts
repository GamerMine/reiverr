import { checkConnection } from '$lib/apis/jellyfin/server/jellyfin.server';
import { fail, redirect } from '@sveltejs/kit';
import { Settings } from '$lib/entities/Settings.server';
import type { LayoutServerLoad } from '../../../.svelte-kit/types/src/routes/$types';

export const load: LayoutServerLoad = async ({ url }) => {
	const jellyfinAPIKey = await Settings.getJellyfinApiKey();

	if (url.pathname === '/setup' && jellyfinAPIKey) {
		throw redirect(301, '/login');
	}
};

export const actions = {
	default: async ({ request }) => {
		let formData = await request.formData();
		let baseURL = formData.get('baseURL') as string;
		let apiKey = formData.get('apiKey') as string;
		let jellyfinConnection = await checkConnection(baseURL, apiKey);

		if (jellyfinConnection.status === 404) {
			return fail(jellyfinConnection.status, { code: 1 });
		} else if (jellyfinConnection.status === 401) {
			return fail(jellyfinConnection.status, { code: 2 });
		}

		await Settings.setJellyfinApiEndpoint(baseURL, apiKey);

		return { success: true };
	}
};
