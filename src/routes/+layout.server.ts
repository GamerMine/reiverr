import { GlobalSettingsEntity } from '@reiverr/db/entities';
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { UserSettingsEntity } from '@reiverr/db/entities';
import { defaultGlobalSettings, defaultUserSettings, type Settings } from '@reiverr/db/types';

export const load: LayoutServerLoad = async ({
	locals: {
		user: { isOidc },
		settings
	}
}) => {
	return {
		settings,
		isOidc,
		error: undefined
	};
};
