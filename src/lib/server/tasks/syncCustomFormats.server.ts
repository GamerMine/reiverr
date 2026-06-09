import type {
	TaskExecutor,
	TaskProgressCallback,
	TaskQueueCallback
} from '$lib/service/scheduler.server';
import { PlatformSchema, type MessageObject } from '$lib/types';
import * as v from 'valibot';
import {
	BaseSync,
	type RadarrLanguageResource,
	type SonarrLanguageResource
} from '$lib/server/tasks/baseSync.server';
import { RadarrMapper } from '$lib/server/mappers/radarrMapper.server';
import { arrayDifference } from '$lib/server/utils.server';
import { SonarrMapper } from '$lib/server/mappers/sonarrMapper.server';
import type { RadarrConnector } from '$lib/server/connectors/radarrConnector.server';
import type { SonarrConnector } from '$lib/server/connectors/sonarrConnector.server';
import { CustomFormatsEntity } from '@reiverr/db/entities';

export class SyncCustomFormats implements TaskExecutor {
	async computeDescription(data: unknown): Promise<MessageObject> {
		void data;
		return { id: 'service.tasks.sync.languagesSync' };
	}

	async computeExecutionDescription(data: unknown): Promise<MessageObject> {
		const platform = v.parse(PlatformSchema, data);
		return { id: 'service.tasks.sync.languagesSyncOn', values: { platform } };
	}

	async queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | MessageObject> {
		void data;
		const baseSync = await BaseSync.getInstance();

		if (baseSync.radarrConnector?.isHealthy()) {
			await queue('radarr');
		}

		if (baseSync.sonarrConnector?.isHealthy()) {
			await queue('sonarr');
		}
	}

	async execute(data: unknown, progress: TaskProgressCallback): Promise<void | MessageObject> {
		const platform = v.parse(PlatformSchema, data);
		const baseSync = await BaseSync.getInstance();
		const formats = await CustomFormatsEntity.getAll();

		if (
			platform === 'radarr' &&
			baseSync.radarrConnector &&
			(await baseSync.radarrConnector.isHealthy())
		) {
			if (baseSync.radarrLanguages.length === 0)
				return { id: 'service.messages.noLanguagesRadarr' };
			return await this.runOnRadarr(
				baseSync.radarrLanguages,
				baseSync.radarrConnector,
				Array.from(formats.values()),
				progress
			);
		}
		if (
			platform === 'sonarr' &&
			baseSync.sonarrConnector &&
			(await baseSync.sonarrConnector.isHealthy())
		) {
			if (baseSync.sonarrLanguages.length === 0)
				return { id: 'service.messages.noLanguagesRadarr' };
			return await this.runOnSonarr(
				baseSync.sonarrLanguages,
				baseSync.sonarrConnector,
				Array.from(formats.values()),
				progress
			);
		}
	}

	async runOnRadarr(
		languages: RadarrLanguageResource[],
		conn: RadarrConnector,
		formats: CustomFormatsEntity[],
		progress: TaskProgressCallback
	): Promise<void | MessageObject> {
		const { data: radarrData } = await conn.getCustomFormats();
		if (!radarrData) return { id: 'service.messages.radarrFetchError' };

		const localIds = formats.map((f) => f.radarrId).filter((id) => id !== undefined);
		const radarrIds = radarrData.map((f) => f.id).filter((id) => id !== undefined);

		const toRemove = arrayDifference(radarrIds, localIds);
		const tmpCreate = arrayDifference(localIds, radarrIds);
		const toCreate = formats.filter(
			(f) => f.radarrId === undefined || tmpCreate.includes(f.radarrId)
		);
		const totalActions = toRemove.length + toCreate.length;
		let doneActions = 0;

		await progress(doneActions, totalActions);
		if (!(await conn.deleteCustomFormatBulk(toRemove)).response.ok)
			return { id: 'service.messages.noLanguagesRadarr' };
		doneActions = toRemove.length;
		await progress(doneActions, totalActions);

		for (const format of toCreate) {
			const langId = languages.find((e) => e.nameLower === format.lang)?.id;
			if (!langId) {
				console.error(`Could not find language ${format.lang} on Radarr.`);
				continue; // FIXME: Continue and reschedule a sync task
			}
			const createdFormat = await conn.addCustomFormat(
				RadarrMapper.customFormatResource(langId, format.lang)
			);
			if (!createdFormat.data || !createdFormat.data.id || !createdFormat.response.ok) {
				console.error(`Could not create CustomFormat on Radarr:\n${createdFormat.error}`);
				continue; // FIXME: Continue and reschedule a sync task
			}
			format.radarrId = createdFormat.data.id;
			await format.save();
			await progress(++doneActions, totalActions);
		}
	}

	async runOnSonarr(
		languages: SonarrLanguageResource[],
		conn: SonarrConnector,
		formats: CustomFormatsEntity[],
		progress: TaskProgressCallback
	): Promise<void | MessageObject> {
		const { data: sonarrData } = await conn.getCustomFormats();
		if (!sonarrData) return { id: 'service.messages.sonarrFetchError' };

		const localIds = formats.map((f) => f.sonarrId).filter((id) => id !== undefined);
		const sonarrIds = sonarrData.map((f) => f.id).filter((id) => id !== undefined);

		const toRemove = arrayDifference(sonarrIds, localIds);
		const tmpCreate = arrayDifference(localIds, sonarrIds);
		const toCreate = formats.filter(
			(f) => f.sonarrId === undefined || tmpCreate.includes(f.sonarrId)
		);
		const totalActions = toRemove.length + toCreate.length;
		let doneActions = 0;

		await progress(doneActions, totalActions);
		if (!(await conn.deleteCustomFormatBulk(toRemove)).response.ok)
			return { id: 'service.messages.noLanguagesSonarr' };
		doneActions = toRemove.length;
		await progress(doneActions, totalActions);

		for (const format of toCreate) {
			const langId = languages.find((e) => e.nameLower === format.lang)?.id;
			if (!langId) {
				console.error(`Could not find language ${format.lang} on Sonarr.`);
				continue; // FIXME: Continue and reschedule a sync task
			}
			const createdFormat = await conn.addCustomFormat(
				SonarrMapper.customFormatResource(langId, format.lang)
			);
			if (!createdFormat.data || !createdFormat.data.id || !createdFormat.response.ok) {
				console.error(`Could not create CustomFormat on Sonarr:\n${createdFormat.error}`);
				continue; // FIXME: Continue and reschedule a sync task
			}
			format.sonarrId = createdFormat.data.id;
			await format.save();
			await progress(++doneActions, totalActions);
		}
	}
}
