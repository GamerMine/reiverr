import { command, form, getRequestEvent } from '$app/server';
import {
	type FilteringProfile,
	FilteringProfileSchema,
	type UserSettings
} from '$lib/entities/Types';
import {
	checkJellyfinConnection,
	isJellyfinUserConnected
} from '$lib/apis/jellyfin/server/jellyfin.server';
import type { JellyfinUser } from '$lib/apis/jellyfin/jellyfinApi';
import { FilteringProfilesEntity } from '$lib/entities/FilteringProfiles.server';
import * as v from 'valibot';
import { assertAdminUserAuth } from '$lib/apis/utils.server';
import { QUALITY_DEFS } from '$lib/constants';
import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';
import { UserSettingsEntity } from '$lib/entities/UserSettings.server';
import { Radarr } from '$lib/server/radarr.server';
import { Sonarr } from '$lib/server/sonarr.server';

// TODO: Add more error message when success: false

export const saveSettings = form(
	v.object({
		userLanguage: v.string(),
		userAutoplayTrailers: v.optional(v.boolean(), false),
		userAnimationDuration: v.number(),
		userDiscoverRegion: v.string(),
		userDiscoverExcludeLibraryItems: v.optional(v.boolean(), false),
		userDiscoverIncludedLanguages: v.string(),

		adminJellyfinBaseUrl: v.optional(v.string()),
		adminJellyfinApiKey: v.optional(v.string()),
		adminRadarrBaseUrl: v.optional(v.string()),
		adminRadarrApiKey: v.optional(v.string()),
		adminRadarrRootFolderPath: v.optional(v.string()),
		adminSonarrBaseUrl: v.optional(v.string()),
		adminSonarrApiKey: v.optional(v.string()),
		adminSonarrRootFolderPath: v.optional(v.string()),
		adminDownloadLanguage: v.optional(v.array(v.string()))
	}),
	async ({
		userLanguage,
		userAutoplayTrailers,
		userAnimationDuration,
		userDiscoverRegion,
		userDiscoverExcludeLibraryItems,
		userDiscoverIncludedLanguages,

		adminJellyfinBaseUrl,
		adminJellyfinApiKey,
		adminRadarrBaseUrl,
		adminRadarrApiKey,
		adminRadarrRootFolderPath,
		adminSonarrBaseUrl,
		adminSonarrApiKey,
		adminSonarrRootFolderPath,
		adminDownloadLanguage
	}) => {
		const { cookies } = getRequestEvent();
		const userReq = await isJellyfinUserConnected(cookies);
		if (userReq.status !== 200) {
			return { success: false };
		}
		const user: JellyfinUser = await userReq.json();

		if (!user.Id) {
			return { success: false };
		}

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

		let needLogin = false;
		if (user.Policy && user.Policy.IsAdministrator) {
			if (
				adminJellyfinBaseUrl &&
				adminJellyfinApiKey &&
				adminJellyfinBaseUrl !== (await GlobalSettingsEntity.getJellyfinBaseUrl())
			) {
				const connection = await checkJellyfinConnection(
					adminJellyfinBaseUrl,
					adminJellyfinApiKey
				);
				if (connection.ok) {
					await GlobalSettingsEntity.setJellyfinApiEndpoint(
						adminJellyfinBaseUrl,
						adminJellyfinApiKey
					);
					cookies.delete('access_token', { path: '/' });
					needLogin = true;
				} else {
					return { success: false };
				}
			}

			// New Radarr BaseUrl & ApiKey
			if (
				adminRadarrBaseUrl &&
				adminRadarrApiKey &&
				adminRadarrBaseUrl !== (await GlobalSettingsEntity.getRadarrBaseUrl())
			) {
				const connection = await Radarr.checkConnection(
					adminRadarrBaseUrl,
					adminRadarrApiKey
				);
				if (connection.ok) {
					await GlobalSettingsEntity.setRadarrApiEndpoint(
						adminRadarrBaseUrl,
						adminRadarrApiKey
					);
				} else {
					return { success: false };
				}
			}

			// If Radarr connection is possible, checks for the configuration
			if ((await Radarr.checkConnection()).ok) {
				if (adminRadarrRootFolderPath) {
					await GlobalSettingsEntity.setRadarrApiConfiguration(adminRadarrRootFolderPath);
				} else {
					return { success: false };
				}
			}

			// New Sonarr BaseUrl & ApiKey
			if (
				adminSonarrBaseUrl &&
				adminSonarrApiKey &&
				adminSonarrBaseUrl !== (await GlobalSettingsEntity.getSonarrBaseUrl())
			) {
				const connection = await Sonarr.checkConnection(
					adminSonarrBaseUrl,
					adminSonarrApiKey
				);
				if (connection.ok) {
					await GlobalSettingsEntity.setSonarrApiEndpoint(
						adminSonarrBaseUrl,
						adminSonarrApiKey
					);
				} else {
					return { success: false };
				}
			}

			// If Sonarr connection is possible, checks for the configuration
			if ((await Sonarr.checkConnection()).ok) {
				if (adminSonarrRootFolderPath) {
					await GlobalSettingsEntity.setSonarrApiConfiguration(adminSonarrRootFolderPath);
				} else {
					return { success: false };
				}
			}
		}

		return {
			success: true,
			needLogin: needLogin
		};
	}
);

export const createFilteringProfile = form(
	v.object({
		name: v.pipe(v.string(), v.nonEmpty()),
		isDefault: v.boolean(),
		qualities: v.array(v.pipe(v.string(), v.nonEmpty()))
	}),
	async ({ name, isDefault, qualities }) => {
		const { cookies } = getRequestEvent();
		await assertAdminUserAuth(cookies);

		for (const quality of qualities) {
			if (!QUALITY_DEFS.includes(quality)) return { success: false };
		}

		// 1. Check if languages are set in GlobalSettings. If not skip to 3
		const languages = await GlobalSettingsEntity.getDownloadLanguages();
		if (languages.length > 0) {
			// 2. Create quality profile on Radarr and Sonarr
		}

		// 3. Create the filtering profile in database
		const profile: FilteringProfile = {
			id: 0,
			name,
			qualities,
			isDefault
		};
		await FilteringProfilesEntity.createFilteringProfile(profile);

		return { success: true };
	}
);

export const deleteFilteringProfile = command(FilteringProfileSchema, async (profile) => {
	const { cookies } = getRequestEvent();
	const userReq = await isJellyfinUserConnected(cookies);
	if (userReq.status !== 200) {
		return { success: false };
	}
	const user: JellyfinUser = await userReq.json();

	if (!user.Id || !user.Policy || !user.Policy.IsAdministrator) {
		return { success: false };
	}

	await FilteringProfilesEntity.deleteFilteringProfile(profile.id);

	return { success: true };
});
