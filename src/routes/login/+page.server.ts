import { type Actions, fail, redirect } from '@sveltejs/kit';
import { GlobalSettingsEntity } from '@reiverr/db/entities';
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
import type { PageServerLoad } from '../../../.svelte-kit/types/src/routes/login/$types';
import type { JellyfinUser } from '$lib/apis/jellyfin/jellyfinApi';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const isConnected = await isJellyfinUserConnected(cookies);

	if (url.pathname === '/login' && isConnected.response.ok) {
		throw redirect(301, '/');
	}
};

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = (formData.get('username') as string) ?? '';
		const password = (formData.get('password') as string) ?? '';
		const authResult = await authenticateJellyfinUser(username, password);

		if (!authResult || !authResult.AccessToken) {
			return fail(401, { code: 1 });
		}

		const proto =
			request.headers.get('x-forwarded-proto') === 'https' || request.url.startsWith('https');

		cookies.set('access_token', authResult.AccessToken, {
			secure: proto,
			httpOnly: true,
			sameSite: 'strict',
			path: '/',
			maxAge: 60 * 60 * 24 * 30
		});

		const user: JellyfinUser | undefined = (await isJellyfinUserConnected(cookies)).data;
		if (!user) return { success: false };

		return { success: true, user };
	}
} satisfies Actions;

async function authenticateJellyfinUser(
	username: string,
	password: string
): Promise<JellyfinAuthenticationResult | undefined> {
	return createClient<paths>({
		baseUrl: (await GlobalSettingsEntity.getJellyfinBaseUrl()) || undefined,
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
