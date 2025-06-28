import {
	checkJellyfinConnection,
	isJellyfinUserConnected
} from '$lib/apis/jellyfin/server/jellyfin.server';
import { UserSettingsEntity } from '$lib/entities/UserSettings.server';
import { fail } from '@sveltejs/kit';
import type { JellyfinUser } from '$lib/apis/jellyfin/jellyfinApi';
import type { UserSettings } from '$lib/entities/Types';
import type { PageServerLoad } from './$types';
import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';
import { checkRadarrConnection } from '$lib/apis/radarr/server/radarr.server';

export const load: PageServerLoad = async ({ cookies }) => {
	const userReq = await isJellyfinUserConnected(cookies);

	if (userReq.status !== 200) {
		return { isAdmin: false };
	}

	const user: JellyfinUser = await userReq.json();

	return {
		isAdmin: user.Policy?.IsAdministrator || false
	};
};

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const userReq = await isJellyfinUserConnected(cookies);
		if (userReq.status !== 200) {
			return fail(userReq.status);
		}
		const user: JellyfinUser = await userReq.json();

		if (!user.Id) {
			return fail(401);
		}

		// User Settings
		const userLanguage = formData.get('userLanguage') as string;
		const userAutoplayTrailers = (formData.get('userAutoplayTrailers') as string) === 'on';
		const userAnimationDuration = +(formData.get('userAnimationDuration') as string);
		const userDiscoverRegion = formData.get('userDiscoverRegion') as string;
		const userDiscoverExcludeLibraryItems =
			(formData.get('userDiscoverExcludeLibraryItems') as string) === 'on';
		const userDiscoverIncludedLanguages = formData.get('userDiscoverIncludedLanguages') as string;
		const userDefaultQualityProfileId = formData.get('userDefaultQualityProfileId') as string;

		// Global Settings (admin only)
		const adminJellyfinBaseUrl = ((formData.get('adminJellyfinBaseUrl') as string) || '').trim();
		const adminJellyfinApiKey = ((formData.get('adminJellyfinApiKey') as string) || '').trim();

		const adminRadarrBaseUrl = ((formData.get('adminRadarrBaseUrl') as string) || '').trim();
		const adminRadarrApiKey = ((formData.get('adminRadarrApiKey') as string) || '').trim();
		const adminRadarrRootFolderPath = (
			(formData.get('adminRadarrRootFolderPath') as string) || ''
		).trim();
		const adminRadarrMonitor = ((formData.get('adminRadarrMonitor') as string) || '').trim();
		const adminRadarrStartSearch =
			((formData.get('adminRadarrStartSearch') as string) || '') === 'on';

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
			},
			radarr: {
				defaultQualityProfileId: userDefaultQualityProfileId
			}
		};

		await UserSettingsEntity.setUserSettings(user.Id, newUserSettings);

		let needLogin = false;
		if (user.Policy && user.Policy.IsAdministrator) {
			if (
				adminJellyfinBaseUrl &&
				adminJellyfinApiKey &&
				adminJellyfinBaseUrl !== (await GlobalSettingsEntity.getJellyfinBaseUrl())
			) {
				const connection = await checkJellyfinConnection(adminJellyfinBaseUrl, adminJellyfinApiKey);
				if (connection.ok) {
					await GlobalSettingsEntity.setJellyfinApiEndpoint(
						adminJellyfinBaseUrl,
						adminJellyfinApiKey
					);
					cookies.delete('access_token', { path: '/' });
					needLogin = true;
				} else {
					return fail(422, { code: 1 });
				}
			}

			// New Radarr BaseUrl & ApiKey
			if (
				adminRadarrBaseUrl &&
				adminRadarrApiKey &&
				adminRadarrBaseUrl !== (await GlobalSettingsEntity.getRadarrBaseUrl())
			) {
				const connection = await checkRadarrConnection(adminRadarrBaseUrl, adminRadarrApiKey);
				if (connection.ok) {
					await GlobalSettingsEntity.setRadarrApiEndpoint(adminRadarrBaseUrl, adminRadarrApiKey);
				} else {
					return fail(422, { code: 2 });
				}
			}

			// If Radarr connection is possible, checks for the configuration
			if (await checkRadarrConnection()) {
				if (adminRadarrRootFolderPath && adminRadarrMonitor) {
					await GlobalSettingsEntity.setRadarrApiConfiguration(
						adminRadarrRootFolderPath,
						adminRadarrMonitor,
						adminRadarrStartSearch
					);
				} else {
					return fail(422, { code: 3 });
				}
			}
		}

		return {
			success: true,
			needLogin: needLogin
		};
	}
};
