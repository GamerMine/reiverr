import type { TaskExecutor, TaskQueueCallback } from '../scheduler.server';
import { PlatformWithDataSchema } from '../types.ts';
import * as v from 'valibot';
import { QualityProfilesEntity } from '@reiverr/db/entities';
import { arrayDifference } from '../utils.server.ts';
import Connectors, { RadarrConnector, SonarrConnector } from '@reiverr/connectors';
import type { RadarrQualityDefinitionResource } from '@reiverr/connectors/types/radarr';
import { RadarrMapper, SonarrMapper } from '@reiverr/connectors/mappers';
import type { SonarrQualityDefinitionResource } from '@reiverr/connectors/types/sonarr';
import Logger, { LogLevel } from '@reiverr/logging';

const ModifiedProfilesIdsSchema = v.array(v.number());
const logger = Logger.getLogger('Task:SyncQualityProfiles');

export class SyncQualityProfiles implements TaskExecutor {
	async queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | string> {
		const modifiedProfileIds = v.parse(ModifiedProfilesIdsSchema, data);
		const baseSync = await Connectors.getInstance();

		if (await baseSync.radarrConnector?.isHealthy()) {
			await queue({ platform: 'radarr', data: modifiedProfileIds });
		}

		if (await baseSync.sonarrConnector?.isHealthy()) {
			await queue({ platform: 'sonarr', data: modifiedProfileIds });
		}
	}

	async execute(data: unknown): Promise<void | string> {
		const parsedData = v.parse(PlatformWithDataSchema(ModifiedProfilesIdsSchema), data);
		const baseSync = await Connectors.getInstance();
		const qualityProfiles = await QualityProfilesEntity.find({
			relations: { customFormat: true, filteringProfile: true }
		});

		if (
			parsedData.platform === 'radarr' &&
			baseSync.radarrConnector &&
			(await baseSync.radarrConnector.isHealthy())
		) {
			if (baseSync.radarrQualities.length === 0) {
				const err = 'No qualities have been fetched from Radarr.';
				logger.log(LogLevel.ERROR, err);
				return err;
			}
			return await this.runOnRadarr(
				baseSync.radarrQualities,
				qualityProfiles,
				baseSync.radarrConnector,
				parsedData.data
			);
		}

		if (
			parsedData.platform === 'sonarr' &&
			baseSync.sonarrConnector &&
			(await baseSync.sonarrConnector.isHealthy())
		) {
			if (baseSync.sonarrQualities.length === 0) {
				const err = 'No qualities have been fetched from Sonarr.';
				logger.log(LogLevel.ERROR, err);
				return err;
			}
			return await this.runOnSonarr(
				baseSync.sonarrQualities,
				qualityProfiles,
				baseSync.sonarrConnector,
				parsedData.data
			);
		}
	}

	async runOnRadarr(
		qualityDefs: RadarrQualityDefinitionResource[],
		profiles: QualityProfilesEntity[],
		conn: RadarrConnector,
		modifiedIds: number[]
	): Promise<void | string> {
		const { data: radarrData } = await conn.getQualityProfile();
		if (!radarrData) {
			const err = 'Cannot fetch quality profiles from Radarr.';
			logger.log(LogLevel.ERROR, err);
			return err;
		}

		const localIds = profiles.map((p) => p.radarrId).filter((id) => id !== null);
		const radarrIds = radarrData.map((p) => p.id).filter((id) => id !== undefined);

		const toRemove = arrayDifference(radarrIds, localIds);
		const tmpCreate = arrayDifference(localIds, radarrIds);
		const toCreate = profiles.filter(
			(p) => p.radarrId === null || tmpCreate.includes(p.radarrId)
		);
		const toEdit = profiles.filter(
			(p) => modifiedIds.includes(p.filteringProfile.id) && !toCreate.includes(p)
		);

		for (const id of toRemove) {
			const res = await conn.deleteQualityProfile(id);
			if (!res.response.ok) {
				const err = `Cannot remove QualityProfile from Radarr:\n${JSON.stringify(res.error, null, 2)}`;
				logger.log(LogLevel.ERROR, err);
				return err;
			}
		}

		const formats = await conn.getCustomFormats();
		if (!formats.response.ok || !formats.data) {
			const err = 'Cannot fetch custom formats from Radarr.';
			logger.log(LogLevel.ERROR, err);
			return err;
		}
		for (const quality of toCreate) {
			const createdQualityProfile = await conn.postQualityProfile(
				RadarrMapper.qualityProfileResource(
					quality.filteringProfile.name,
					quality.customFormat.lang,
					quality.filteringProfile.qualities,
					qualityDefs,
					formats.data
				)
			);
			if (
				!createdQualityProfile.data ||
				!createdQualityProfile.data.id ||
				!createdQualityProfile.response.ok
			) {
				const err = `Cannot create QualityProfile on Radarr:\n${JSON.stringify(createdQualityProfile.error, null, 2)}`;
				logger.log(LogLevel.ERROR, err);
				return err;
			}
			quality.radarrId = createdQualityProfile.data.id;
			await quality.save();
		}

		for (const quality of toEdit) {
			const radarrProfile = radarrData.find((p) => p.id === quality.radarrId);
			if (!radarrProfile || !radarrProfile.items || !quality.radarrId) {
				const err = `Cannot update QualityProfile with id ${quality.radarrId} on Radarr`;
				logger.log(LogLevel.ERROR, err);
				return err;
			}
			const resource = RadarrMapper.qualityProfileResource(
				quality.filteringProfile.name,
				quality.customFormat.lang,
				quality.filteringProfile.qualities,
				qualityDefs,
				formats.data
			);
			radarrProfile.items = resource.items;
			radarrProfile.cutoff = resource.cutoff;

			const res = await conn.putQualityProfile(quality.radarrId, radarrProfile);
			if (!res.response.ok) {
				const err = `Cannot update QualityProfile with id ${quality.radarrId} on Radarr: ${JSON.stringify(res.error, null, 2)}`;
				logger.log(LogLevel.ERROR, err);
				return err;
			}
		}
	}

	async runOnSonarr(
		qualityDefs: SonarrQualityDefinitionResource[],
		profiles: QualityProfilesEntity[],
		conn: SonarrConnector,
		modifiedIds: number[]
	): Promise<void | string> {
		const { data: sonarrData } = await conn.getQualityProfile();
		if (!sonarrData) {
			const err = 'Cannot fetch quality profiles from Sonarr.';
			logger.log(LogLevel.ERROR, err);
			return err;
		}

		const localIds = profiles.map((p) => p.sonarrId).filter((id) => id !== null);
		const sonarrIds = sonarrData.map((p) => p.id).filter((id) => id !== undefined);

		const toRemove = arrayDifference(sonarrIds, localIds);
		const tmpCreate = arrayDifference(localIds, sonarrIds);
		const toCreate = profiles.filter(
			(p) => p.sonarrId === null || tmpCreate.includes(p.sonarrId)
		);
		const toEdit = profiles.filter(
			(p) => modifiedIds.includes(p.filteringProfile.id) && !toCreate.includes(p)
		);

		for (const id of toRemove) {
			const res = await conn.deleteQualityProfile(id);
			if (!res.response.ok) {
				const err = `Cannot remove QualityProfile from Sonarr:\n${JSON.stringify(res.error, null, 2)}`;
				logger.log(LogLevel.ERROR, err);
				return err;
			}
		}

		const formats = await conn.getCustomFormats();
		if (!formats.success || !formats.data) {
			const err = 'Cannot fetch custom formats from Sonarr.';
			logger.log(LogLevel.ERROR, err);
			return err;
		}
		for (const quality of toCreate) {
			const createdQualityProfile = await conn.postQualityProfile(
				SonarrMapper.qualityProfileResource(
					quality.filteringProfile.name,
					quality.customFormat.lang,
					quality.filteringProfile.qualities,
					qualityDefs,
					formats.data
				)
			);
			if (
				!createdQualityProfile.data ||
				!createdQualityProfile.data.id ||
				!createdQualityProfile.response.ok
			) {
				const err = `Cannot create QualityProfile on Sonarr:\n${JSON.stringify(createdQualityProfile.error, null, 2)}`;
				logger.log(LogLevel.ERROR, err);
				return err;
			}
			quality.sonarrId = createdQualityProfile.data.id;
			await quality.save();
		}

		for (const quality of toEdit) {
			const sonarrProfile = sonarrData.find((p) => p.id === quality.sonarrId);
			if (!sonarrProfile || !sonarrProfile.items || !quality.sonarrId) {
				const err = `Cannot update QualityProfile with id ${quality.sonarrId} on Sonarr`;
				logger.log(LogLevel.ERROR, err);
				return err;
			}
			const resource = SonarrMapper.qualityProfileResource(
				quality.filteringProfile.name,
				quality.customFormat.lang,
				quality.filteringProfile.qualities,
				qualityDefs,
				formats.data
			);
			sonarrProfile.items = resource.items;
			sonarrProfile.cutoff = resource.cutoff;

			const res = await conn.putQualityProfile(quality.sonarrId, sonarrProfile);
			if (!res.response.ok) {
				const err = `Cannot update QualityProfile with id ${quality.sonarrId} on Sonarr: ${JSON.stringify(res.error, null, 2)}`;
				logger.log(LogLevel.ERROR, err);
				return err;
			}
		}
	}
}
