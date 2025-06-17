import { isJellyfinUserConnected } from '$lib/apis/jellyfin/server/jellyfin.server';
import { UserSettingsEntity } from '$lib/entities/UserSettings.server';
import { fail } from '@sveltejs/kit';
import type { JellyfinUser } from '$lib/apis/jellyfin/jellyfinApi';
import type { UserSettings } from '$lib/entities/Types';

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const userReq = await isJellyfinUserConnected(cookies);
		if (userReq.status !== 200) {
			return fail(userReq.status);
		}
		const user: JellyfinUser = await userReq.json();

		if (!user.Id || !user.Policy) {
			return fail(401);
		}

		// User Settings
		const userLanguage = formData.get('userLanguage') as string;
		const userAutoplayTrailers = (formData.get('userAutoplayTrailers:') as string) === 'on';
		const userAnimationDuration = +(formData.get('userAnimationDuration') as string);
		const userDiscoverRegion = formData.get('userDiscoverRegion') as string;
		const userDiscoverExcludeLibraryItems =
			(formData.get('userDiscoverExcludeLibraryItems') as string) === 'on';
		const userDiscoverIncludedLanguages = formData.get('userDiscoverIncludedLanguages') as string;

		// Global Settings (admin only)
		const adminJellyfinBaseUrl = formData.get('adminJellyfinBaseUrl') as string;
		const adminJellyfinApiKey = formData.get('adminJellyfinApiKey') as string;

		const newUserSettings: UserSettings = {
			interface: {
				language: userLanguage,
				autoplayTrailers: userAutoplayTrailers,
				animationDuration: userAnimationDuration
			},
			discover: {
				region: userDiscoverRegion,
				excludeLibraryItems: userDiscoverExcludeLibraryItems,
				includedLanguages: userDiscoverIncludedLanguages
			}
		};

		await UserSettingsEntity.setUserSettings(user.Id, newUserSettings);
	}
};
