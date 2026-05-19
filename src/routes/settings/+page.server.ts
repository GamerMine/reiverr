import {
	checkJellyfinConnection,
	isJellyfinUserConnected
} from '$lib/apis/jellyfin/server/jellyfin.server';
import { UserSettingsEntity } from '$lib/entities/UserSettings.server';
import { fail } from '@sveltejs/kit';
import type { JellyfinUser } from '$lib/apis/jellyfin/jellyfinApi';
import type {FilteringProfile, UserSettings} from '$lib/entities/Types';
import type { PageServerLoad } from './$types';
import { GlobalSettingsEntity } from '$lib/entities/GlobalSettings.server';
import { checkRadarrConnection } from '$lib/apis/radarr/server/radarr.server';
import { checkSonarrConnection } from '$lib/apis/sonarr/server/sonarr.server';
import {FilteringProfilesEntity} from "$lib/entities/FilteringProfiles.server";

export const load: PageServerLoad = async ({ cookies }) => {
	const userReq = await isJellyfinUserConnected(cookies);

	if (userReq.status !== 200) {
		return { isAdmin: false };
	}

	const user: JellyfinUser = await userReq.json();
	const filteringProfiles = await FilteringProfilesEntity.getAll();

	return {
		isAdmin: user.Policy?.IsAdministrator || false,
		filteringProfiles
	};
};

export const actions = {
	save: async ({ request, cookies }) => {
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

		// Global Settings (admin only)
		const adminJellyfinBaseUrl = ((formData.get('adminJellyfinBaseUrl') as string) || '').trim();
		const adminJellyfinApiKey = ((formData.get('adminJellyfinApiKey') as string) || '').trim();

		const adminRadarrBaseUrl = ((formData.get('adminRadarrBaseUrl') as string) || '').trim();
		const adminRadarrApiKey = ((formData.get('adminRadarrApiKey') as string) || '').trim();
		const adminRadarrRootFolderPath = (
			(formData.get('adminRadarrRootFolderPath') as string) || ''
		).trim();
		const adminSonarrBaseUrl = ((formData.get('adminSonarrBaseUrl') as string) || '').trim();
		const adminSonarrApiKey = ((formData.get('adminSonarrApiKey') as string) || '').trim();
		const adminSonarrRootFolderPath = (
			(formData.get('adminSonarrRootFolderPath') as string) || ''
		).trim();
		const adminSonarrMonitor = ((formData.get('adminSonarrMonitor') as string) || '').trim();
		const adminSonarrStartSearch =
			((formData.get('adminSonarrStartSearch') as string) || '') === 'on';

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
				adminRadarrBaseUrl.length !== 0 &&
				adminRadarrApiKey.length !== 0 &&
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
			if ((await checkRadarrConnection()).ok) {
				if (adminRadarrRootFolderPath) {
					await GlobalSettingsEntity.setRadarrApiConfiguration(
						adminRadarrRootFolderPath,
					);
				} else {
					return fail(422, { code: 3 });
				}
			}

			// New Sonarr BaseUrl & ApiKey
			if (
				adminSonarrBaseUrl.length !== 0 &&
				adminSonarrApiKey.length !== 0 &&
				adminSonarrBaseUrl !== (await GlobalSettingsEntity.getSonarrBaseUrl())
			) {
				const connection = await checkSonarrConnection(adminSonarrBaseUrl, adminSonarrApiKey);
				if (connection.ok) {
					await GlobalSettingsEntity.setSonarrApiEndpoint(adminSonarrBaseUrl, adminSonarrApiKey);
				} else {
					return fail(422, { code: 4 });
				}
			}

			// If Sonarr connection is possible, checks for the configuration
			if ((await checkSonarrConnection()).ok) {
				if (adminSonarrRootFolderPath && adminSonarrMonitor) {
					await GlobalSettingsEntity.setSonarrApiConfiguration(
						adminSonarrRootFolderPath,
						adminSonarrMonitor,
						adminSonarrStartSearch
					);
				} else {
					return fail(422, { code: 5 });
				}
			}
		}

		return {
			success: true,
			needLogin: needLogin
		};
	},

	createFilteringProfile: async ({ request, cookies }) => {
		const formData = await request.formData();
		const userReq = await isJellyfinUserConnected(cookies);
		if (userReq.status !== 200) {
			return fail(userReq.status);
		}
		const user: JellyfinUser = await userReq.json();

		if (!user.Id) {
			return fail(401);
		}

		if (!user.Policy || !user.Policy.IsAdministrator) {
			return fail(403);
		}

		const profileName = formData.get('profileName') as string;
		const language = formData.get('language') as string;
		const qualities = formData.getAll('qualities') as string[];

		const profile: FilteringProfile = {
			name: profileName,
			language,
			qualities
		}

		await FilteringProfilesEntity.createFilteringProfile(profile);

		return {
			success: true,
		}
	}
};
