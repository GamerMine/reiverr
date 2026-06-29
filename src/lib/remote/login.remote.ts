import { form, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import Connectors from '@reiverr/connectors';
import { getBrowserName } from '$lib/utils/browser-detection.ts';
import { version } from '$app/environment';

export const login = form(
	v.object({
		username: v.pipe(v.string(), v.nonEmpty()),
		_password: v.pipe(v.string(), v.nonEmpty())
	}),
	async (creds) => {
		const { cookies, request } = getRequestEvent();
		const conn = (await Connectors.getInstance()).jellyfinConnector;
		const authResult = await conn.postUsersAuthenticateByName(
			creds.username,
			creds._password,
			getBrowserName(),
			version
		);

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

		return { success: true, data: authResult.data.User };
	}
);
