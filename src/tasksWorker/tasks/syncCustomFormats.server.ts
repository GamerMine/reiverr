import type { TaskExecutor, TaskQueueCallback } from '../scheduler.server';
import { PlatformSchema } from '../types.ts';
import * as v from 'valibot';
import { arrayDifference } from '../utils.server.ts';
import { CustomFormatsEntity } from '@reiverr/db/entities';
import Connectors, { RadarrConnector, SonarrConnector } from '@reiverr/connectors';
import type { RadarrLanguageResource } from '@reiverr/connectors/types/radarr';
import { RadarrMapper, SonarrMapper } from '@reiverr/connectors/mappers';
import type { SonarrLanguageResource } from '@reiverr/connectors/types/sonarr';
import Logger, { LogLevel } from '@reiverr/logging';

const logger = Logger.getLogger('Task:SyncCustomFormats');

export class SyncCustomFormats implements TaskExecutor {
	async queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | string> {
		void data;
		const baseSync = await Connectors.getInstance();

		if (await baseSync.radarrConnector?.isHealthy()) {
			await queue('radarr');
		}

		if (await baseSync.sonarrConnector?.isHealthy()) {
			await queue('sonarr');
		}
	}

	async execute(data: unknown): Promise<void | string> {
		const platform = v.parse(PlatformSchema, data);
		const baseSync = await Connectors.getInstance();
		const formats = await CustomFormatsEntity.getAll();

		if (
			platform === 'radarr' &&
			baseSync.radarrConnector &&
			(await baseSync.radarrConnector.isHealthy())
		) {
			if (baseSync.radarrLanguages.length === 0) {
				const err = 'No languages have been fetched from Radarr.';
				logger.log(LogLevel.ERROR, err);
				return err;
			}
			return await this.runOnRadarr(
				baseSync.radarrLanguages,
				baseSync.radarrConnector,
				Array.from(formats.values())
			);
		}
		if (
			platform === 'sonarr' &&
			baseSync.sonarrConnector &&
			(await baseSync.sonarrConnector.isHealthy())
		) {
			if (baseSync.sonarrLanguages.length === 0) {
				const err = 'No languages have been fetched from Sonarr.';
				logger.log(LogLevel.ERROR, err);
				return err;
			}
			return await this.runOnSonarr(
				baseSync.sonarrLanguages,
				baseSync.sonarrConnector,
				Array.from(formats.values())
			);
		}
	}

	async runOnRadarr(
		languages: RadarrLanguageResource[],
		conn: RadarrConnector,
		formats: CustomFormatsEntity[]
	): Promise<void | string> {
		const { data: radarrData } = await conn.getCustomFormats();
		if (!radarrData) {
			const err = 'Cannot fetch custom formats from Radarr.';
			logger.log(LogLevel.ERROR, err);
			return err;
		}

		const localIds = formats.map((f) => f.radarrId).filter((id) => id !== null);
		const radarrIds = radarrData.map((f) => f.id).filter((id) => id !== undefined);

		const toRemove = arrayDifference(radarrIds, localIds);
		const tmpCreate = arrayDifference(localIds, radarrIds);
		const toCreate = formats.filter(
			(f) => f.radarrId === null || tmpCreate.includes(f.radarrId)
		);

		if (!(await conn.deleteCustomFormatBulk(toRemove)).response.ok) {
			const err = 'Cannot delete custom formats from Radarr.';
			logger.log(LogLevel.ERROR, err);
			return err;
		}

		for (const format of toCreate) {
			const langId = languages.find((e) => e.nameLower === format.lang)?.id;
			if (!langId) {
				const err = `Could not find language ${format.lang} on Radarr.`;
				logger.log(LogLevel.ERROR, err);
				return err;
			}
			const createdFormat = await conn.postCustomFormat(
				RadarrMapper.customFormatResource(langId, format.lang)
			);
			if (!createdFormat.data || !createdFormat.data.id || !createdFormat.response.ok) {
				const err = `Could not create CustomFormat on Radarr: ${createdFormat.error}`;
				logger.log(LogLevel.ERROR, err);
				return err;
			}
			format.radarrId = createdFormat.data.id;
			await format.save();
		}
	}

	async runOnSonarr(
		languages: SonarrLanguageResource[],
		conn: SonarrConnector,
		formats: CustomFormatsEntity[]
	): Promise<void | string> {
		const { data: sonarrData } = await conn.getCustomFormats();
		if (!sonarrData) {
			const err = 'Cannot fetch custom formats from Sonarr.';
			logger.log(LogLevel.ERROR, err);
			return err;
		}

		const localIds = formats.map((f) => f.sonarrId).filter((id) => id !== null);
		const sonarrIds = sonarrData.map((f) => f.id).filter((id) => id !== undefined);

		const toRemove = arrayDifference(sonarrIds, localIds);
		const tmpCreate = arrayDifference(localIds, sonarrIds);
		const toCreate = formats.filter(
			(f) => f.sonarrId === null || tmpCreate.includes(f.sonarrId)
		);

		if (!(await conn.deleteCustomFormatBulk(toRemove)).response.ok) {
			const err = 'Cannot delete custom formats from Sonarr.';
			logger.log(LogLevel.ERROR, err);
			return err;
		}

		for (const format of toCreate) {
			const langId = languages.find((e) => e.nameLower === format.lang)?.id;
			if (!langId) {
				const err = `Could not find language ${format.lang} on Sonarr.`;
				logger.log(LogLevel.ERROR, err);
				return err;
			}
			const createdFormat = await conn.postCustomFormat(
				SonarrMapper.customFormatResource(langId, format.lang)
			);
			if (!createdFormat.data || !createdFormat.data.id || !createdFormat.response.ok) {
				const err = `Could not create CustomFormat on Sonarr:\n${createdFormat.error}`;
				logger.log(LogLevel.ERROR, err);
				return err;
			}
			format.sonarrId = createdFormat.data.id;
			await format.save();
		}
	}
}
