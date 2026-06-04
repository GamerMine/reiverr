import { command, form, getRequestEvent } from '$app/server';
import {
	checkJellyfinConnection,
	isJellyfinUserConnected
} from '$lib/apis/jellyfin/server/jellyfin.server';
import type { JellyfinUser } from '$lib/apis/jellyfin/jellyfinApi';
import * as v from 'valibot';
import { assertAdminUserAuth } from '$lib/server/utils.server';
import { QUALITY_DEFS } from '$lib/constants';
import { Radarr } from '$lib/server/radarr.server';
import { Sonarr } from '$lib/server/sonarr.server';
import { In, Not } from 'typeorm';
import { scheduleTask, TaskType } from '$lib/service/scheduler.server';
import {
	CustomFormatsEntity,
	FilteringProfilesEntity,
	GlobalSettingsEntity,
	QualityProfilesEntity,
	UserSettingsEntity
} from '@reiverr/db/entities';
import {
	type FilteringProfile,
	FilteringProfileSchema,
	type UserSettings
} from '@reiverr/db/types';

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
			if (!adminDownloadLanguages) adminDownloadLanguages = [];
			await CustomFormatsEntity.upsertFormats(adminDownloadLanguages);
			await QualityProfilesEntity.delete({
				customFormat: { lang: Not(In(adminDownloadLanguages)) }
			});
			await CustomFormatsEntity.delete({
				lang: Not(In(adminDownloadLanguages))
			});
			await scheduleTask(TaskType.SYNC_CUSTOM_FORMATS, undefined);

			const [filteringProfiles, formats] = await Promise.all([
				FilteringProfilesEntity.find(),
				CustomFormatsEntity.find()
			]);
			const profiles: QualityProfilesEntity[] = [];
			for (const filteringProfile of filteringProfiles) {
				for (const format of formats) {
					profiles.push(
						QualityProfilesEntity.create({ customFormat: format, filteringProfile })
					);
				}
			}
			await QualityProfilesEntity.upsert(profiles, {
				conflictPaths: ['customFormat', 'filteringProfile'],
				skipUpdateIfNoValuesChanged: true
			});
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

		const profile: FilteringProfile = {
			id: 0,
			name: profileName,
			qualities,
			isDefault: !!isDefault
		};

		let entity;
		if (action === 'update') {
			if (!profileId || Number.isNaN(profileId)) return { success: false };
			profile.id = Number(profileId);
			entity = await FilteringProfilesEntity.editFilteringProfile(profile);
		} else {
			entity = await FilteringProfilesEntity.createFilteringProfile(profile);
		}

		if (!entity) return { success: false };

		const languages = await CustomFormatsEntity.getAll();
		for (const [lang, format] of languages.entries()) {
			let radarrId: number | undefined = undefined;
			let sonarrId: number | undefined = undefined;

			if (await Radarr.checkConnection()) {
				const res = await Radarr.addQualityProfile(profileName, lang, qualities);
				if (!res.success || !res.id) return { success: false };
				radarrId = res.id;
			}
			if (await Sonarr.checkConnection()) {
				const res = await Sonarr.addQualityProfile(profileName, lang, qualities);
				if (!res.success || !res.id) return { success: false };
				sonarrId = res.id;
			}

			await QualityProfilesEntity.createProfile(format, radarrId, sonarrId, entity);
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
