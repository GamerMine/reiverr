import { type Actions, fail, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from '../../../.svelte-kit/types/src/routes/$types';
import { Settings } from '$lib/entities/Settings.server';
import createClient from 'openapi-fetch';
import type { paths } from '$lib/apis/jellyfin/jellyfin.generated';
import {
	getDeviceIdFromUsername,
	isJellyfinUserConnected,
	JELLYFIN_CLIENT,
	JELLYFIN_CLIENT_VERSION,
	JELLYFIN_DEVICE,
	type JellyfinAuthenticationResult
} from '$lib/apis/jellyfin/server/jellyfin.server';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const isConnected = await isJellyfinUserConnected(cookies);

	if (url.pathname === '/login' && isConnected.status === 200) {
		throw redirect(301, '/');
	}
};

export const actions = {
	default: async ({ request, cookies }) => {
		let formData = await request.formData();
		let username = (formData.get('username') as string) ?? '';
		let password = (formData.get('password') as string) ?? '';
		let authResult = await authenticateJellyfinUser(username, password);

		if (!authResult || !authResult.AccessToken) {
			return fail(401, { code: 1 });
		}

		cookies.set('access_token', authResult.AccessToken, {
			httpOnly: true,
			sameSite: 'strict',
			path: '/',
			maxAge: 60 * 60 * 24 * 30
		});

		return { success: true };
	}
} satisfies Actions;

async function authenticateJellyfinUser(
	username: string,
	password: string
): Promise<JellyfinAuthenticationResult | undefined> {
	return createClient<paths>({
		baseUrl: (await Settings.getJellyfinBaseUrl()) || undefined,
		headers: {
			Authorization: `MediaBrowser Client=${JELLYFIN_CLIENT}, Device=${JELLYFIN_DEVICE}, DeviceId=${await getDeviceIdFromUsername(username)}, Version=${JELLYFIN_CLIENT_VERSION}`
		}
	})
		.POST('/Users/AuthenticateByName', {
			body: {
				Username: username,
				Pw: password
			}
		})
		.then((res) => {
			return res.data;
		});
}
