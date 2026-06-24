import { form, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import {
	getDeviceIdFromUsername,
	isJellyfinUserConnected,
	JELLYFIN_CLIENT,
	JELLYFIN_CLIENT_VERSION,
	JELLYFIN_DEVICE
} from '$lib/apis/jellyfin/server/jellyfin.server.ts';
import createClient from 'openapi-fetch';
import type { paths } from '$lib/apis/jellyfin/jellyfin.generated';
import { GlobalSettingsEntity } from '@reiverr/db/entities';

export const login = form(
	v.object({
		username: v.pipe(v.string(), v.nonEmpty()),
		_password: v.pipe(v.string(), v.nonEmpty())
	}),
	async (creds) => {
		const { cookies, request } = getRequestEvent();
		const authResult = await authenticateJellyfinUser(creds.username, creds._password);

		if (!authResult.response.ok) {
			if (authResult.response.status === 401) {
				return { success: false, error: 'login.invalidCredential' };
			}
			console.error(
				`Status ${authResult.response.status} ${authResult.response.statusText}`,
				JSON.stringify(authResult.error, null, 2)
			);
			return { success: false };
		}
		if (!authResult.data?.AccessToken) {
			console.error(`Failed attempt to login user "${creds.username}": Missing access token`);
			return { success: false };
		}

		const proto =
			request.headers.get('x-forwarded-proto') === 'https' || request.url.startsWith('https');

		cookies.set('access_token', authResult.data.AccessToken, {
			secure: proto,
			httpOnly: true,
			sameSite: 'strict',
			path: '/',
			maxAge: 60 * 60 * 24 * 30
		});

		const user = await isJellyfinUserConnected(cookies);
		if (!user.response.ok) console.error(JSON.stringify(user.error, null, 2));

		return { success: user.response.ok, data: user.data };
	}
);

async function authenticateJellyfinUser(username: string, password: string) {
	return createClient<paths>({
		baseUrl: (await GlobalSettingsEntity.getJellyfinBaseUrl()) || undefined,
		headers: {
			Authorization: `MediaBrowser Client=${JELLYFIN_CLIENT}, Device=${JELLYFIN_DEVICE}, DeviceId=${await getDeviceIdFromUsername(username)}, Version=${JELLYFIN_CLIENT_VERSION}`
		}
	}).POST('/Users/AuthenticateByName', {
		body: {
			Username: username,
			Pw: password
		}
	});
}
