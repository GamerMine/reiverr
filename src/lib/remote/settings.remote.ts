import { command, form, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { assertUserAuth } from '$lib/server/utils.server';
import { QUALITY_DEFS } from '$lib/utils/constants.ts';
import { In, Not } from 'typeorm';
import { scheduleTask } from '../../tasksWorker/scheduler.server';
import {
	CustomFormatsEntity,
	FilteringProfilesEntity,
	GlobalSettingsEntity,
	QualityProfilesEntity,
	UserSettingsEntity
} from '@reiverr/db/entities';
import { type FilteringProfile, FilteringProfileSchema, TaskType } from '@reiverr/db/types';
import { OptionalStringSchema, type Result } from '$lib/utils/types.ts';
import { JellyfinConnector, RadarrConnector, SonarrConnector } from '@reiverr/connectors';
import { PlatformSchema } from '../../tasksWorker/types.ts';

export const saveSettings = form(
	v.object({
		userLanguage: v.string(),
		userAutoplayTrailers: v.optional(v.boolean(), false),
		userAnimationDuration: v.number(),
		userDiscoverRegion: v.string(),
		userDiscoverExcludeLibraryItems: v.optional(v.boolean(), false),
		userDiscoverIncludedLanguages: v.string(),
		userFilteringProfileId: v.optional(v.number()),

		adminJellyfinBaseUrl: OptionalStringSchema,
		adminJellyfinApiKey: OptionalStringSchema,
		adminRadarrBaseUrl: OptionalStringSchema,
		adminRadarrApiKey: OptionalStringSchema,
		adminRadarrRootFolderPath: OptionalStringSchema,
		adminSonarrBaseUrl: OptionalStringSchema,
		adminSonarrApiKey: OptionalStringSchema,
		adminSonarrRootFolderPath: OptionalStringSchema,
		adminDownloadLanguages: v.optional(v.array(v.string())),
		adminUserCanChooseProfile: v.optional(v.boolean(), false)
	}),
	async (settings): Promise<Result<{ needLogin: boolean }>> => {
		const { cookies } = getRequestEvent();
		const { userId, isAdmin } = await assertUserAuth(cookies);
		if (!userId) return { success: false, error: 'general.connectionRequired' };

		await UserSettingsEntity.upsert(
			{
				userId: userId,
				language: settings.userLanguage,
				autoplayTrailers: settings.userAutoplayTrailers,
				animationDuration: settings.userAnimationDuration,
				discoverRegion: settings.userDiscoverRegion,
				discoverExcludeLibraryItems: settings.userDiscoverExcludeLibraryItems,
				discoverIncludedLanguages: settings.userDiscoverIncludedLanguages,
				filteringProfileId: settings.userFilteringProfileId
			},
			{
				conflictPaths: ['userId'],
				skipUpdateIfNoValuesChanged: true
			}
		);

		let needLogin = false;
		if (isAdmin) {
			const globalSettings = await GlobalSettingsEntity.getDefault();
			if (
				settings.adminJellyfinBaseUrl &&
				settings.adminJellyfinApiKey &&
				settings.adminJellyfinBaseUrl !== globalSettings.jellyfinBaseUrl
			) {
				const connection = await new JellyfinConnector(
					settings.adminJellyfinBaseUrl,
					settings.adminJellyfinApiKey
				).isHealthy();
				if (connection) {
					globalSettings.jellyfinBaseUrl = settings.adminJellyfinBaseUrl;
					globalSettings.jellyfinApiKey = settings.adminJellyfinApiKey;
					cookies.delete('access_token', { path: '/' });
					needLogin = true;
				} else {
					return { success: false, error: 'settings.misc.checkJellyfinCredentials' };
				}
			}

			// New Radarr BaseUrl & ApiKey
			let radarrHealthy: boolean;
			if (
				settings.adminRadarrBaseUrl &&
				settings.adminRadarrApiKey &&
				settings.adminRadarrBaseUrl !== globalSettings.radarrBaseUrl
			) {
				radarrHealthy = await new RadarrConnector(
					settings.adminRadarrBaseUrl,
					settings.adminRadarrApiKey
				).isHealthy();
				if (radarrHealthy) {
					globalSettings.radarrBaseUrl = settings.adminRadarrBaseUrl;
					globalSettings.radarrApiKey = settings.adminRadarrApiKey;
				} else {
					return { success: false, error: 'settings.misc.checkRadarrCredentials' };
				}
			} else {
				radarrHealthy = await new RadarrConnector(
					globalSettings.radarrBaseUrl ?? '',
					globalSettings.radarrApiKey ?? ''
				).isHealthy();
			}

			// If Radarr connection is possible, checks for the configuration
			if (radarrHealthy) {
				if (settings.adminRadarrRootFolderPath) {
					globalSettings.radarrRootFolderPath = settings.adminRadarrRootFolderPath;
				} else {
					return { success: false, error: 'settings.misc.radarrConfigurationInvalid' };
				}
			}

			// New Sonarr BaseUrl & ApiKey
			let sonarrHealthy: boolean;
			if (
				settings.adminSonarrBaseUrl &&
				settings.adminSonarrApiKey &&
				settings.adminSonarrBaseUrl !== globalSettings.sonarrBaseUrl
			) {
				sonarrHealthy = await new SonarrConnector(
					settings.adminSonarrBaseUrl,
					settings.adminSonarrApiKey
				).isHealthy();
				if (sonarrHealthy) {
					globalSettings.sonarrBaseUrl = settings.adminSonarrBaseUrl;
					globalSettings.sonarrApiKey = settings.adminSonarrApiKey;
				} else {
					return { success: false, error: 'settings.misc.checkSonarrCredentials' };
				}
			} else {
				sonarrHealthy = await new SonarrConnector(
					globalSettings.sonarrBaseUrl ?? '',
					globalSettings.sonarrApiKey ?? ''
				).isHealthy();
			}

			// If Sonarr connection is possible, checks for the configuration
			if (sonarrHealthy) {
				if (settings.adminSonarrRootFolderPath) {
					globalSettings.sonarrRootFolderPath = settings.adminSonarrRootFolderPath;
				} else {
					return { success: false, error: 'settings.misc.sonarrConfigurationInvalid' };
				}
			}

			globalSettings.userCanChooseProfile = settings.adminUserCanChooseProfile;

			await globalSettings.save();

			// Set other admin settings
			if (!settings.adminDownloadLanguages) settings.adminDownloadLanguages = [];
			let customFormatModified =
				(await CustomFormatsEntity.upsertFormats(settings.adminDownloadLanguages))
					.identifiers.length > 0;

			let qualityProfileModified =
				((
					await QualityProfilesEntity.delete({
						customFormat: In(
							(
								await CustomFormatsEntity.find({
									select: { id: true },
									where: { lang: Not(In(settings.adminDownloadLanguages)) }
								})
							).map((f) => f.id)
						)
					})
				).affected ?? 1) > 0;
			customFormatModified =
				((
					await CustomFormatsEntity.delete({
						lang: Not(In(settings.adminDownloadLanguages))
					})
				).affected ?? 1) > 0 || customFormatModified;
			if (customFormatModified) await scheduleTask(TaskType.SYNC_CUSTOM_FORMATS, undefined);

			const [filteringProfiles, formats] = await Promise.all([
				FilteringProfilesEntity.find(),
				CustomFormatsEntity.find()
			]);
			const profiles: QualityProfilesEntity[] = [];
			for (const filteringProfile of filteringProfiles) {
				for (const format of formats) {
					profiles.push(
						QualityProfilesEntity.create({
							customFormat: format,
							filteringProfile
						})
					);
				}
			}
			qualityProfileModified =
				(
					await QualityProfilesEntity.upsert(profiles, {
						conflictPaths: ['customFormat', 'filteringProfile'],
						skipUpdateIfNoValuesChanged: true
					})
				).identifiers.length > 0 || qualityProfileModified;

			if (qualityProfileModified) await scheduleTask(TaskType.SYNC_QUALITY_PROFILES, []);
		}

		return {
			success: true,
			data: { needLogin }
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
	async ({
		profileName,
		isDefault,
		qualities,
		action,
		profileId
	}): Promise<Result<undefined>> => {
		const { cookies } = getRequestEvent();
		const { isAdmin } = await assertUserAuth(cookies);
		if (!isAdmin) return { success: false, error: 'general.connectionRequired' };

		for (const quality of qualities) {
			if (!QUALITY_DEFS.includes(quality))
				return { success: false, error: 'general.invalidInputs' };
		}

		const profile: FilteringProfile = {
			id: 0,
			name: profileName,
			qualities,
			isDefault: !!isDefault
		};

		if (action === 'update') {
			if (!profileId || Number.isNaN(profileId))
				return { success: false, error: 'general.invalidInputs' };
			profile.id = Number(profileId);
			await FilteringProfilesEntity.editFilteringProfile(profile);
		} else {
			const entity = await FilteringProfilesEntity.createFilteringProfile(profile);
			await QualityProfilesEntity.upsert(
				(await CustomFormatsEntity.find()).map((f) => ({
					customFormat: f,
					filteringProfile: entity
				})),
				{
					conflictPaths: ['filteringProfile', 'customFormat'],
					skipUpdateIfNoValuesChanged: true
				}
			);
		}

		await scheduleTask(TaskType.SYNC_QUALITY_PROFILES, profileId ? [profileId] : []);

		return { success: true };
	}
);

export const deleteFilteringProfile = command(FilteringProfileSchema, async (profile) => {
	const { cookies } = getRequestEvent();
	const { isAdmin } = await assertUserAuth(cookies);
	if (!isAdmin) return { success: false, error: 'general.connectionRequired' };

	await QualityProfilesEntity.delete({
		filteringProfile: { id: profile.id }
	});

	await FilteringProfilesEntity.deleteFilteringProfile(profile.id);
	await scheduleTask(TaskType.SYNC_QUALITY_PROFILES, []);

	return { success: true };
});

export const deleteIntegration = command(PlatformSchema, async (platform) => {
	const { cookies } = getRequestEvent();
	const { isAdmin } = await assertUserAuth(cookies);
	if (!isAdmin) return { success: false, error: 'general.connectionRequired' };

	const globalSettings = await GlobalSettingsEntity.getDefault();
	switch (platform) {
		case 'radarr':
			globalSettings.radarrBaseUrl = null;
			globalSettings.radarrApiKey = null;
			globalSettings.radarrRootFolderPath = null;
			break;
		case 'sonarr':
			globalSettings.sonarrBaseUrl = null;
			globalSettings.sonarrApiKey = null;
			globalSettings.sonarrRootFolderPath = null;
			break;
	}

	await globalSettings.save();
	return { success: true };
});
