import type { PageServerLoad } from './$types';
import { FilteringProfilesEntity, GlobalSettingsEntity } from '@reiverr/db/entities';

export const load: PageServerLoad = async ({
	locals: {
		user: { isAdmin }
	}
}) => {
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
