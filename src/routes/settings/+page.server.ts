import { isJellyfinUserConnected } from '$lib/apis/jellyfin/server/jellyfin.server';
import type { PageServerLoad } from './$types';
import { FilteringProfilesEntity, GlobalSettingsEntity } from '@reiverr/db/entities';

export const load: PageServerLoad = async ({ cookies }) => {
	const userReq = await isJellyfinUserConnected(cookies);

	if (!userReq.response.ok || !userReq.data) {
		return { isAdmin: false };
	}

	const filteringProfiles = await FilteringProfilesEntity.getAll();
	const isAdmin = userReq.data?.Policy?.IsAdministrator || false;

	return {
		isAdmin,
		filteringProfiles:
			isAdmin || (await GlobalSettingsEntity.getClient()).general.userCanChooseProfile
				? filteringProfiles
				: undefined
	};
};
