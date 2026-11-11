import { form, command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import Connectors from '@unifarr/connectors';
import { getBrowserName } from '#lib/utils/browser-detection.ts';
import { version } from '$app/env';
import Logger, { LogLevel } from '@unifarr/logging';
import {
	ACCESS_TOKEN_COOKIE,
	ACCESS_TYPE_COOKIE,
	AccessType,
	cookiesParam,
	logoutUser
} from '#lib/server/auth/auth.ts';

const logger = Logger.getLogger('Authentication');

export const login = form(
	v.object({
		username: v.pipe(v.string(), v.nonEmpty()),
		_password: v.pipe(v.string(), v.nonEmpty())
	}),
	async (creds) => {
		const { cookies } = getRequestEvent();
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
			logger.log(
				LogLevel.ERROR,
				`${authResult.response.status} ${authResult.response.statusText} ${JSON.stringify(authResult.error, null, 2)}`
			);
			return { success: false };
		}
		if (!authResult.data?.AccessToken) {
			logger.log(
				LogLevel.ERROR,
				`Failed attempt to login user "${creds.username}": Missing access token`
			);
			return { success: false };
		}

		cookies.set(ACCESS_TYPE_COOKIE, AccessType.JELLYFIN, cookiesParam());
		cookies.set(ACCESS_TOKEN_COOKIE, authResult.data.AccessToken, cookiesParam());

		return { success: true, data: authResult.data.User };
	}
);

export const logout = command(async () => {
	const { cookies } = getRequestEvent();
	logoutUser(cookies);
});
