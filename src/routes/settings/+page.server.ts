import type { PageServerLoad } from './$types';
import { FilteringProfilesEntity, GlobalSettingsEntity } from '@reiverr/db/entities';
import { assertUserAuth } from '$lib/server/utils.server.ts';

export const load: PageServerLoad = async ({ cookies }) => {
	const { isAdmin } = await assertUserAuth(cookies);

	if (!isAdmin) return { isAdmin: false };

	const filteringProfiles = await FilteringProfilesEntity.getAll();

	return {
		isAdmin,
		filteringProfiles:
			isAdmin || (await GlobalSettingsEntity.getClient()).general.userCanChooseProfile
				? filteringProfiles
				: undefined
	};
};
