import { type Cookies, error } from '@sveltejs/kit';
import { isJellyfinUserConnected } from '$lib/apis/jellyfin/server/jellyfin.server';

export function assertParam(url: URL, name: string): string {
	const param = url.searchParams.get(name);
	if (param === null) {
		throw error(400, `Missing parameter: ${name}`);
	} else {
		return param;
	}
}

export async function assertUserAuth(cookies: Cookies) {
	const auth = await isJellyfinUserConnected(cookies);

	return auth.response.ok ? auth.data?.Id : undefined;
}

export async function assertAdminUserAuth(cookies: Cookies) {
	const auth = await isJellyfinUserConnected(cookies);

	if (!auth.response.ok) {
		throw error(403, 'Unauthorized');
	}

	const user = auth.data;

	if (!user?.Id) {
		throw error(401);
	}

	if (!user.Policy || !user.Policy.IsAdministrator) {
		throw error(403);
	}
}

/**
 * Computes intersection between array a and b, i.e. keep elements that are in a and b.
 *
 * @param a Array a
 * @param b Array b
 */
export function arrayIntersect<T>(a: T[], b: T[]): T[] {
	const setB = new Set(b);
	return a.filter((x) => setB.has(x));
}

/**
 * Computes array difference between a and b, i.e. keep elements that are in a and not in b.
 *
 * @param a Array a
 * @param b Array b
 */
export function arrayDifference<T>(a: T[], b: T[]): T[] {
	const setB = new Set(b);
	return a.filter((x) => !setB.has(x));
}
