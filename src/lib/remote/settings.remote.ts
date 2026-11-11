import { getRequestEvent } from '$app/server';
import { adminCommand, adminForm, protectedForm } from '#lib/server/auth/remote-guards.ts';
import * as v from 'valibot';
import { ACCESS_TOKEN_COOKIE } from '#lib/server/auth/auth.js';
import { QUALITY_DEFS } from '#lib/utils/constants.ts';
import { In, IsNull, Not } from 'typeorm';
import { scheduleTask } from '../../tasksWorker/scheduler.server';
import {
	CustomFormatsEntity,
	FilteringProfilesEntity,
	GlobalSettingsEntity,
	QualityProfilesEntity,
	UserSettingsEntity
} from '@unifarr/db/entities';
import { type FilteringProfile, FilteringProfileSchema, TaskType } from '@unifarr/db/types';
import { type Result } from '#lib/utils/types.ts';
import Connectors, {
	JellyfinConnector,
	RadarrConnector,
	SonarrConnector
} from '@unifarr/connectors';
import { PlatformSchema } from '../../tasksWorker/types.ts';
import { OptionalStringSchema } from '#lib/utils/schemas.ts';

export const saveSettings = protectedForm(
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
		adminUserCanChooseProfile: v.optional(v.boolean(), false),
		adminFilteringProfiles: v.optional(
			v.pipe(v.string(), v.parseJson(), v.array(FilteringProfileSchema))
		)
	}),
	async (settings) => {
		const {
			locals: {
				user: { userId, isAdmin }
			},
			cookies
		} = getRequestEvent();

		await UserSettingsEntity.upsert(
			{
				userId: userId!,
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
		let changed = false;
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
					cookies.delete(ACCESS_TOKEN_COOKIE, { path: '/' });
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
					changed = true;
				} else {
					return { success: false, error: 'settings.misc.checkRadarrCredentials' };
				}
			} else {
				radarrHealthy = await new RadarrConnector(
					globalSettings.radarrBaseUrl ?? '',
					globalSettings.radarrApiKey ?? ''
				)
					.isHealthy()
					.catch(() => false);
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
					changed = true;
				} else {
					return { success: false, error: 'settings.misc.checkSonarrCredentials' };
				}
			} else {
				sonarrHealthy = await new SonarrConnector(
					globalSettings.sonarrBaseUrl ?? '',
					globalSettings.sonarrApiKey ?? ''
				)
					.isHealthy()
					.catch(() => false);
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
			await Connectors.getInstance(true);

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
			if (customFormatModified || changed)
				await scheduleTask(userId!, TaskType.SYNC_CUSTOM_FORMATS, undefined);

			// Apply the filtering profiles draft (create / edit / delete)
			let profilesStructureChanged = false;
			const editedProfileIds: number[] = [];
			if (settings.adminFilteringProfiles) {
				const draft = settings.adminFilteringProfiles;
				for (const profile of draft) {
					for (const quality of profile.qualities) {
						if (!QUALITY_DEFS.includes(quality))
							return { success: false, error: 'general.invalidInputs' };
					}
				}

				const existing = await FilteringProfilesEntity.find();
				const existingById = new Map(existing.map((p) => [p.id, p]));
				const keptIds = new Set(draft.filter((p) => p.id > 0).map((p) => p.id));
				const removed = existing.filter((p) => !keptIds.has(p.id));
				for (const profile of removed) {
					await QualityProfilesEntity.delete({ filteringProfile: { id: profile.id } });
					await FilteringProfilesEntity.deleteFilteringProfile(profile.id);
				}
				if (removed.length > 0) profilesStructureChanged = true;

				// Non default profiles first so the default one is applied last
				const sorted = [...draft].sort((a, b) => Number(a.isDefault) - Number(b.isDefault));
				for (const profile of sorted) {
					if (profile.id > 0) {
						const current = existingById.get(profile.id);
						const modified =
							!current ||
							current.name !== profile.name ||
							current.isDefault !== profile.isDefault ||
							current.qualities.join(',') !== profile.qualities.join(',');
						if (modified) {
							await FilteringProfilesEntity.editFilteringProfile(profile);
							editedProfileIds.push(profile.id);
						}
					} else {
						await FilteringProfilesEntity.createFilteringProfile(profile);
						profilesStructureChanged = true;
					}
				}
			}

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

			// Full sync when profiles were created/deleted (or the integrations changed),
			// otherwise only sync the profiles that were edited.
			if (qualityProfileModified || changed || profilesStructureChanged)
				await scheduleTask(userId!, TaskType.SYNC_QUALITY_PROFILES, []);
			else if (editedProfileIds.length > 0)
				await scheduleTask(userId!, TaskType.SYNC_QUALITY_PROFILES, editedProfileIds);
		}

		return {
			success: true,
			data: {
				needLogin,
				globalSettings: await GlobalSettingsEntity.getClient(),
				userSettings: await UserSettingsEntity.getUserSettings(userId!)
			}
		};
	}
);

export const deleteIntegration = adminCommand(PlatformSchema, async (platform) => {
	const globalSettings = await GlobalSettingsEntity.getDefault();
	switch (platform) {
		case 'radarr':
			globalSettings.radarrBaseUrl = null;
			globalSettings.radarrApiKey = null;
			globalSettings.radarrRootFolderPath = null;
			await CustomFormatsEntity.update({ radarrId: Not(IsNull()) }, { radarrId: null });
			await QualityProfilesEntity.update({ radarrId: Not(IsNull()) }, { radarrId: null });
			break;
		case 'sonarr':
			globalSettings.sonarrBaseUrl = null;
			globalSettings.sonarrApiKey = null;
			globalSettings.sonarrRootFolderPath = null;
			await CustomFormatsEntity.update({ sonarrId: Not(IsNull()) }, { sonarrId: null });
			await QualityProfilesEntity.update({ sonarrId: Not(IsNull()) }, { sonarrId: null });
			break;
	}

	await globalSettings.save();
	await Connectors.getInstance(true);
	return { success: true };
});
