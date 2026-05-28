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
import { CustomFormatsEntity } from '$lib/entities/CustomFormats.server';
import { QualityProfilesEntity } from '$lib/entities/QualityProfiles.server';

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
		adminDownloadLanguages: v.optional(v.array(v.string()))
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
		adminDownloadLanguages
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
				if (connection) {
					await GlobalSettingsEntity.setRadarrApiEndpoint(
						adminRadarrBaseUrl,
						adminRadarrApiKey
					);
				} else {
					return { success: false };
				}
			}

			// If Radarr connection is possible, checks for the configuration
			if (await Radarr.checkConnection()) {
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
				if (connection) {
					await GlobalSettingsEntity.setSonarrApiEndpoint(
						adminSonarrBaseUrl,
						adminSonarrApiKey
					);
				} else {
					return { success: false };
				}
			}

			// If Sonarr connection is possible, checks for the configuration
			if (await Sonarr.checkConnection()) {
				if (adminSonarrRootFolderPath) {
					await GlobalSettingsEntity.setSonarrApiConfiguration(adminSonarrRootFolderPath);
				} else {
					return { success: false };
				}
			}

			// Set other admin settings
			// FIXME: This should be moved to a task.
			{
				const radarrConnection = await Radarr.checkConnection();
				const sonarrConnection = await Sonarr.checkConnection();
				// Handling Custom Format creation and deletion
				if (!adminDownloadLanguages) adminDownloadLanguages = [];
				if (adminDownloadLanguages) {
					const availableCustomProfiles = await CustomFormatsEntity.getAll();

					for (const lang of adminDownloadLanguages) {
						if (!availableCustomProfiles.has(lang)) {
							let radarrId: number | undefined = undefined;
							let sonarrId: number | undefined = undefined;

							if (radarrConnection) {
								const radarrRes = await Radarr.addCustomFormat(lang);
								if (!radarrRes.success || !radarrRes.id) return { success: false };
								radarrId = radarrRes.id;
							}
							if (sonarrConnection) {
								const sonarrRes = await Sonarr.addCustomFormat(lang);
								if (!sonarrRes.success || !sonarrRes.id) return { success: false };
								sonarrId = sonarrRes.id;
							}
							await CustomFormatsEntity.createFormat(lang, radarrId, sonarrId);
						}
						availableCustomProfiles.delete(lang);
					}

					// Removing unused custom formats
					const radarrIds: number[] = [];
					const sonarrIds: number[] = [];
					for (const profile of availableCustomProfiles.values()) {
						if (profile.radarrId) radarrIds.push(profile.radarrId);
						if (profile.sonarrId) sonarrIds.push(profile.sonarrId);
						await CustomFormatsEntity.deleteFormat(profile.id);
					}
					if (radarrIds.length > 0) await Radarr.deleteCustomFormats(radarrIds);
					if (sonarrIds.length > 0) await Sonarr.deleteCustomFormats(sonarrIds);
				}

				// Handling Quality Profiles
				const profiles = await FilteringProfilesEntity.getAll();
				for (const profile of profiles) {
					for (const lang of adminDownloadLanguages) {
						if (!(await QualityProfilesEntity.profileExists(profile.id, lang))) {
							let radarrId: number | undefined = undefined;
							let sonarrId: number | undefined = undefined;

							if (radarrConnection) {
								const res = await Radarr.addQualityProfile(
									profile.name,
									lang,
									profile.qualities
								);
								if (!res.success || !res.id) return { success: false };
								radarrId = res.id;
							}
							if (sonarrConnection) {
								const res = await Sonarr.addQualityProfile(
									profile.name,
									lang,
									profile.qualities
								);
								if (!res.success || !res.id) return { success: false };
								sonarrId = res.id;
							}

							await QualityProfilesEntity.createProfile(lang, radarrId, sonarrId);
						}
					}
				}
			}
		}

		return {
			success: true,
			needLogin: needLogin
		};
	}
);

export const createUpdateFilteringProfile = form(
	v.object({
		profileName: v.pipe(v.string(), v.nonEmpty()),
		isDefault: v.optional(v.boolean()),
		qualities: v.array(v.pipe(v.string(), v.nonEmpty())),
		action: v.picklist(['create', 'update']),
		profileId: v.optional(v.number())
	}),
	async ({ profileName, isDefault, qualities, action, profileId }) => {
		const { cookies } = getRequestEvent();
		await assertAdminUserAuth(cookies);

		for (const quality of qualities) {
			if (!QUALITY_DEFS.includes(quality)) return { success: false };
		}

		const languages = await GlobalSettingsEntity.getDownloadLanguages();
		if (languages.length > 0) {
			// TODO: Create quality profile on Radarr and Sonarr
		}

		const profile: FilteringProfile = {
			id: 0,
			name: profileName,
			qualities,
			isDefault: !!isDefault
		};

		if (action === 'update') {
			if (!profileId || Number.isNaN(profileId)) return { success: false };
			profile.id = Number(profileId);
			await FilteringProfilesEntity.editFilteringProfile(profile);
		} else if (action === 'create') {
			await FilteringProfilesEntity.createFilteringProfile(profile);
		}

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
