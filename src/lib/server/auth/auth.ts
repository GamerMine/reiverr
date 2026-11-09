import { type Cookies } from '@sveltejs/kit';
import { checkOidcSession, destroyOidcSession, OIDC_LOGIN_COOKIE } from '#lib/server/auth/oidc.ts';
import { APP_URL } from '$app/env/public';
import { OIDC_ENABLED } from '$app/env/private';
import { checkSession } from '#lib/server/auth/login.ts';

export const ACCESS_TYPE_COOKIE = 'access_type';
export const ACCESS_TOKEN_COOKIE = 'access_token';

export enum AccessType {
	JELLYFIN = 'jellyfin',
	OIDC = 'oidc'
}

export function cookiesParam(age?: number) {
	return {
		secure: String(APP_URL).startsWith('https'),
		httpOnly: true,
		sameSite: 'strict' as 'strict',
		path: '/',
		maxAge: age ?? 60 * 60 * 24 * 30
	};
}

export function isProtected(url?: Readonly<{ pathname: string }> | null) {
	return !(url && url.pathname.match(/^\/auth.*|^\/setup.*/));
}

export async function getUser(cookies: Cookies): Promise<{
	userId: string | null;
	username: string;
	isAdmin: boolean;
	isOidc: boolean;
}> {
	const accessToken = cookies.get(ACCESS_TOKEN_COOKIE) ?? '';
	const isOidc = cookies.get(ACCESS_TYPE_COOKIE) === AccessType.OIDC && (OIDC_ENABLED as boolean);

	const user = isOidc ? checkOidcSession(accessToken) : await checkSession(accessToken);

	return { ...user, isOidc };
}

export function logoutUser(cookies: Cookies) {
	destroyOidcSession(cookies.get(ACCESS_TOKEN_COOKIE));

	cookies.delete(OIDC_LOGIN_COOKIE);
	cookies.delete(ACCESS_TYPE_COOKIE);
	cookies.delete(ACCESS_TOKEN_COOKIE);
}

export function guestUser() {
	return { userId: null, username: 'Guest', isAdmin: false, isOidc: false };
}
