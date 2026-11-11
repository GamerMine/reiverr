import { FilteringProfilesEntity, GlobalSettingsEntity } from '@unifarr/db/entities';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({
	locals: {
		user: { isAdmin }
	}
}) => {
	const filteringProfiles = await FilteringProfilesEntity.getAll();

	return {
		isAdmin,
		filteringProfiles:
			isAdmin || (await GlobalSettingsEntity.getClient()).general.userCanChooseProfile
				? filteringProfiles
				: undefined
	};
};
