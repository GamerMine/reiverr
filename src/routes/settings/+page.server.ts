import { isJellyfinUserConnected } from '$lib/apis/jellyfin/server/jellyfin.server';
import type { JellyfinUser } from '$lib/apis/jellyfin/jellyfinApi';
import type { PageServerLoad } from './$types';
import { FilteringProfilesEntity } from '@reiverr/db/entities';

export const load: PageServerLoad = async ({ cookies }) => {
	const userReq = await isJellyfinUserConnected(cookies);

	if (userReq.status !== 200) {
		return { isAdmin: false };
	}

	const user: JellyfinUser = await userReq.json();
	const filteringProfiles = await FilteringProfilesEntity.getAll();

	return {
		isAdmin: user.Policy?.IsAdministrator || false,
		filteringProfiles
	};
};
