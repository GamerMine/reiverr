import { type Cookies, error } from '@sveltejs/kit';
import { isJellyfinUserConnected } from '$lib/apis/jellyfin/server/jellyfin.server';
import type { JellyfinUser } from '$lib/apis/jellyfin/jellyfinApi';

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

	if (!auth.ok) {
		throw error(403, 'Unauthorized');
	}
}

export async function assertAdminUserAuth(cookies: Cookies) {
	const auth = await isJellyfinUserConnected(cookies);

	if (!auth.ok) {
		throw error(403, 'Unauthorized');
	}

	const user: JellyfinUser = await auth.json();

	if (!user.Id) {
		throw error(401);
	}

	if (!user.Policy || !user.Policy.IsAdministrator) {
		throw error(403);
	}
}

export async function assertAdminAuth(cookies: Cookies) {
	const auth = await isJellyfinUserConnected(cookies);

	if (!auth.ok) {
		throw error(403, 'Unauthorized');
	} else {
		const user: JellyfinUser = await auth.json();
		if (!user.Policy?.IsAdministrator) {
			throw error(403, 'Unauthorized');
		}
	}
}
