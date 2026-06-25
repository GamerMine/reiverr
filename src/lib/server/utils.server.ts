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

	return auth.response.ok
		? { userId: auth.data?.Id, username: auth.data?.Name }
		: { userId: undefined, username: undefined };
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
