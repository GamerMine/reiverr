import * as client from 'openid-client';
import {
	OIDC_ADMINS_GROUP,
	OIDC_CLIENT_ID,
	OIDC_CLIENT_SECRET,
	OIDC_GROUPS_CLAIM,
	OIDC_ISSUER,
	OIDC_SCOPE
} from '$app/env/private';
import { APP_URL } from '$app/env/public';
import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/env';
import Connectors from '@reiverr/connectors';
import Logger, { LogLevel } from '@reiverr/logging';
import {
	ACCESS_TOKEN_COOKIE,
	ACCESS_TYPE_COOKIE,
	AccessType,
	cookiesParam,
	guestUser,
	logoutUser
} from '#lib/server/auth/auth.ts';
import { OidcIdentityEntity } from '@reiverr/db/entities';
import { randomUUID, type UUID } from 'node:crypto';

const logger = Logger.getLogger('OIDC');

export const OIDC_LOGIN_COOKIE = 'oidc_login';
export const SESSION_TTL = 1000 * 60 * 15;

const DISCOVER_CACHE = {
	config: {} as client.Configuration,
	expires: Date.now()
};

const SESSIONS: Map<
	UUID,
	{ userId: string; isAdmin: boolean; username: string; token: string; expires: number }
> = new Map();

export async function discoverConfig() {
	if (DISCOVER_CACHE.expires < Date.now()) {
		if (!OIDC_ISSUER) {
			throw new Error('OIDC_ISSUER is missing');
		}

		if (!OIDC_CLIENT_ID) {
			throw new Error('OIDC_CLIENT_ID is missing');
		}

		if (!OIDC_CLIENT_SECRET) {
			throw new Error('OIDC_CLIENT_SECRET is missing');
		}

		logger.log(LogLevel.INFO, 'Discovering OIDC configuration');

		DISCOVER_CACHE.config = await client.discovery(
			OIDC_ISSUER,
			OIDC_CLIENT_ID,
			OIDC_CLIENT_SECRET,
			undefined,
			dev ? { execute: [client.allowInsecureRequests] } : undefined
		);

		DISCOVER_CACHE.expires = Date.now() + SESSION_TTL;
	}

	return DISCOVER_CACHE.config;
}

export async function initiateLogin(cookies: Cookies, silent?: boolean) {
	const config: client.Configuration = await discoverConfig();

	const codeVerifier = client.randomPKCECodeVerifier();
	const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
	const state = client.randomState();
	let nonce;

	const parameters = {
		redirect_uri: `${APP_URL}auth/callback`,
		scope: OIDC_SCOPE ?? 'openid groups profile',
		code_challenge: codeChallenge,
		code_challenge_method: 'S256',
		state: state
	};

	if (silent) {
		// @ts-expect-error TS is bad
		parameters.prompt = 'none';
	}

	if (!config.serverMetadata().supportsPKCE()) {
		nonce = client.randomNonce();

		// @ts-expect-error TS is bad
		parameters.nonce = nonce;
	}

	const redirectTo = client.buildAuthorizationUrl(config, parameters);

	cookies.set(OIDC_LOGIN_COOKIE, JSON.stringify({ codeVerifier, state, nonce }), {
		secure: String(APP_URL).startsWith('https'),
		httpOnly: true,
		sameSite: 'strict',
		path: '/',
		maxAge: 60 * 30
	});

	return redirectTo.href;
}

export async function completeLogin(url: URL, cookies: Cookies) {
	const config: client.Configuration = await discoverConfig();

	const { codeVerifier, state, nonce } = JSON.parse(<string>cookies.get(OIDC_LOGIN_COOKIE));

	logoutUser(cookies);

	const tokens = await client.authorizationCodeGrant(config, url, {
		pkceCodeVerifier: codeVerifier,
		expectedState: state,
		expectedNonce: nonce
	});

	const claims = tokens.claims()!;

	const userInfo = await client.fetchUserInfo(config, tokens.access_token, claims.sub);

	const rawGroups = claims[OIDC_GROUPS_CLAIM ?? 'groups'];
	const groups = Array.isArray(rawGroups) ? rawGroups.map(String) : [];

	const isAdmin = groups.includes(OIDC_ADMINS_GROUP ?? 'admins');

	const data = await syncWithJellyfin(
		claims.sub,
		userInfo.preferred_username ?? claims.sub,
		isAdmin
	);

	const localAccessToken = randomUUID();

	SESSIONS.set(localAccessToken, {
		token: tokens.access_token,
		userId: data.Id,
		username: '',
		isAdmin,
		expires: Date.now() + SESSION_TTL
	});

	cookies.set(ACCESS_TYPE_COOKIE, AccessType.OIDC, cookiesParam());
	cookies.set(ACCESS_TOKEN_COOKIE, localAccessToken, cookiesParam());

	return data;
}

export function checkOidcSession(accessToken: string) {
	const session = SESSIONS.get(accessToken as UUID);

	if (session) {
		if (session.expires < Date.now()) {
			SESSIONS.delete(accessToken as UUID);
		} else {
			return {
				userId: session.userId,
				username: session.username,
				isAdmin: session.isAdmin
			};
		}
	}

	return guestUser();
}

export function destroyOidcSession(accessToken?: string | null) {
	if (accessToken) SESSIONS.delete(accessToken as UUID);
}

async function syncWithJellyfin(sub: string, name: string, isAdmin: boolean) {
	const conn = (await Connectors.getInstance()).jellyfinConnector;
	const id = await OidcIdentityEntity.get(sub);

	let userData;

	if (id) {
		const user = await conn.getUser(id.userId);
		if (!user.response.ok) {
			logger.log(LogLevel.ERROR, JSON.stringify(user.error, null, 2));
			throw new Error(`Unable to get user ${name} (${id.userId})`);
		}

		userData = user.data;

		if (userData.Name !== name) {
			logger.log(LogLevel.INFO, `Correcting name of ${name}`);

			const updateUser = await conn.postUpdateUser(id.userId, name);
			if (!updateUser.response.ok) {
				logger.log(LogLevel.ERROR, JSON.stringify(updateUser.error, null, 2));
			}
		}

		if (userData.Policy.IsAdministrator !== isAdmin) {
			logger.log(LogLevel.INFO, `Correcting policy of ${name}`);

			const updateUserPolicy = await conn.postUpdateUserPolicy(id.userId, isAdmin);
			if (!updateUserPolicy.response.ok) {
				logger.log(LogLevel.ERROR, JSON.stringify(updateUserPolicy.error, null, 2));
			}
		}
	} else {
		const users = await conn.getUsers();
		if (!users.response.ok) {
			logger.log(LogLevel.ERROR, JSON.stringify(users.error, null, 2));
			throw new Error('Unable to list users of Jellyfin');
		}

		let user = users.data?.find((user) => user.Name === name);
		if (!user) {
			logger.log(
				LogLevel.INFO,
				`User ${name} not found in Jellyfin user database, creating...`
			);

			const newUser = await conn.postCreateUserByName(name);
			if (!users.response.ok) {
				logger.log(LogLevel.ERROR, JSON.stringify(users.error, null, 2));
				throw new Error(`Unable create new user ${name}`);
			}

			const updateUserPolicy = await conn.postUpdateUserPolicy(newUser.data.Id, isAdmin);
			if (!updateUserPolicy.response.ok) {
				logger.log(LogLevel.ERROR, JSON.stringify(updateUserPolicy.error, null, 2));
			}

			user = newUser.data;
		}

		logger.log(LogLevel.INFO, `Associating ${name} to ${user.Id}`);
		await OidcIdentityEntity.save({ userId: user.Id, sub });

		userData = user;
	}

	return userData;
}
