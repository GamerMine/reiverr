import { isJellyfinUserConnected } from '$lib/apis/jellyfin/server/jellyfin.server';
import type { PageServerLoad } from './$types';
import { FilteringProfilesEntity } from '@reiverr/db/entities';

export const load: PageServerLoad = async ({ cookies }) => {
	const userReq = await isJellyfinUserConnected(cookies);

	if (!userReq.response.ok) {
		return { isAdmin: false };
	}

	const filteringProfiles = await FilteringProfilesEntity.getAll();

	return {
		isAdmin: userReq.data?.Policy?.IsAdministrator || false,
		filteringProfiles
	};
};
