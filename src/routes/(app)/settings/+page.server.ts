import type { PageServerLoad } from './$types';
import { FilteringProfilesEntity } from '@reiverr/db/entities';

export const load: PageServerLoad = async ({
	locals: {
		user: { isAdmin },
		settings
	}
}) => {
	const filteringProfiles = await FilteringProfilesEntity.getAll();

	return {
		isAdmin,
		filteringProfiles:
			isAdmin || settings.globalSettings.general.userCanChooseProfile
				? filteringProfiles
				: undefined
	};
};
