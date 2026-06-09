import type {
	TaskExecutor,
	TaskProgressCallback,
	TaskQueueCallback
} from '$lib/service/scheduler.server';
import { PlatformSchema, PlatformWithDataSchema, type MessageObject } from '$lib/types';
import {
	BaseSync,
	type RadarrQualityDefinitionResource,
	type SonarrQualityDefinitionResource
} from '$lib/server/tasks/baseSync.server';
import * as v from 'valibot';
import type { InferOutput } from 'valibot';
import type { RadarrConnector } from '$lib/server/connectors/radarrConnector.server';
import { QualityProfilesEntity } from '@reiverr/db/entities';
import { arrayDifference } from '$lib/server/utils.server';
import { RadarrMapper } from '$lib/server/mappers/radarrMapper.server';
import type { SonarrConnector } from '$lib/server/connectors/sonarrConnector.server';
import { SonarrMapper } from '$lib/server/mappers/sonarrMapper.server';

const ModifiedProfilesIdsSchema = v.array(v.number());
export type ModifiedProfilesIds = InferOutput<typeof ModifiedProfilesIdsSchema>;

export class SyncQualityProfiles implements TaskExecutor {
	async computeExecutionDescription(data: unknown): Promise<MessageObject> {
		void data;
		return { id: 'service.tasks.sync.qualitySync' };
	}

	async computeDescription(data: unknown): Promise<MessageObject> {
		const platform = v.parse(PlatformSchema, data);
		return { id: 'service.tasks.sync.qualitySyncOn', values: { platform } };
	}

	async queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | MessageObject> {
		const modifiedProfileIds = v.parse(ModifiedProfilesIdsSchema, data);
		const baseSync = await BaseSync.getInstance();

		if (baseSync.radarrConnector?.isHealthy()) {
			await queue({ platform: 'radarr', data: modifiedProfileIds });
		}

		if (baseSync.sonarrConnector?.isHealthy()) {
			await queue({ platform: 'sonarr', data: modifiedProfileIds });
		}
	}

	async execute(data: unknown, progress: TaskProgressCallback): Promise<void | MessageObject> {
		const parsedData = v.parse(PlatformWithDataSchema(ModifiedProfilesIdsSchema), data);
		const baseSync = await BaseSync.getInstance();
		const qualityProfiles = await QualityProfilesEntity.find({
			relations: { customFormat: true, filteringProfile: true }
		});

		if (
			parsedData.platform === 'radarr' &&
			baseSync.radarrConnector &&
			(await baseSync.radarrConnector.isHealthy())
		) {
			if (baseSync.radarrQualities.length === 0)
				return { id: 'service.messages.noQualitiesRadarr' };
			return await this.runOnRadarr(
				baseSync.radarrQualities,
				qualityProfiles,
				baseSync.radarrConnector,
				parsedData.data,
				progress
			);
		}

		if (
			parsedData.platform === 'sonarr' &&
			baseSync.sonarrConnector &&
			(await baseSync.sonarrConnector.isHealthy())
		) {
			if (baseSync.sonarrQualities.length === 0)
				return { id: 'service.messages.noQualitiesSonarr' };
			return await this.runOnSonarr(
				baseSync.sonarrQualities,
				qualityProfiles,
				baseSync.sonarrConnector,
				parsedData.data,
				progress
			);
		}
	}

	async runOnRadarr(
		qualityDefs: RadarrQualityDefinitionResource[],
		profiles: QualityProfilesEntity[],
		conn: RadarrConnector,
		modifiedIds: number[],
		progress: TaskProgressCallback
	): Promise<void | MessageObject> {
		const { data: radarrData } = await conn.getQualityProfile();
		if (!radarrData) return { id: 'service.message.radarrFetchError' };

		const localIds = profiles.map((p) => p.radarrId).filter((id) => id !== undefined);
		const radarrIds = radarrData.map((p) => p.id).filter((id) => id !== undefined);

		const toRemove = arrayDifference(radarrIds, localIds);
		const tmpCreate = arrayDifference(localIds, radarrIds);
		const toCreate = profiles.filter(
			(p) => p.radarrId === undefined || tmpCreate.includes(p.radarrId)
		);
		const toEdit = profiles.filter(
			(p) => modifiedIds.includes(p.filteringProfile.id) && !toCreate.includes(p)
		);
		const totalActions = toRemove.length + toCreate.length + toEdit.length;
		let doneActions = 0;

		await progress(doneActions, totalActions);
		for (const id of toRemove) {
			const res = await conn.deleteQualityProfile(id);
			if (!res.response.ok) {
				console.error(
					`Cannot remove QualityProfile from Radarr:\n${JSON.stringify(res.error, null, 2)}`
				);
				return { id: 'service.messages.noQualityProfileRadarr' };
			}
			await progress(++doneActions, totalActions);
		}

		const formats = await conn.getCustomFormats();
		if (!formats.success || !formats.data) return { id: 'service.messages.radarrFetchError' };
		for (const quality of toCreate) {
			const createdQualityProfile = await conn.addQualityProfile(
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
				console.error(
					`Cannot create QualityProfile on Radarr:\n${JSON.stringify(createdQualityProfile.error, null, 2)}`
				);
				continue;
			}
			quality.radarrId = createdQualityProfile.data.id;
			await quality.save();
			await progress(++doneActions, totalActions);
		}

		for (const quality of toEdit) {
			const radarrProfile = radarrData.find((p) => p.id === quality.radarrId);
			if (!radarrProfile || !radarrProfile.items || !quality.radarrId) {
				console.error(`Cannot update QualityProfile with id ${quality.radarrId} on Radarr`);
				continue;
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
				console.error(
					`Cannot update QualityProfile with id ${quality.radarrId} on Radarr:`,
					JSON.stringify(res.error, null, 2)
				);
				continue;
			}
			await progress(++doneActions, totalActions);
		}
	}

	async runOnSonarr(
		qualityDefs: SonarrQualityDefinitionResource[],
		profiles: QualityProfilesEntity[],
		conn: SonarrConnector,
		modifiedIds: number[],
		progress: TaskProgressCallback
	): Promise<void | MessageObject> {
		const { data: sonarrData } = await conn.getQualityProfile();
		if (!sonarrData) return { id: 'service.message.sonarrFetchError' };

		const localIds = profiles.map((p) => p.sonarrId).filter((id) => id !== undefined);
		const sonarrIds = sonarrData.map((p) => p.id).filter((id) => id !== undefined);

		const toRemove = arrayDifference(sonarrIds, localIds);
		const tmpCreate = arrayDifference(localIds, sonarrIds);
		const toCreate = profiles.filter(
			(p) => p.sonarrId === undefined || tmpCreate.includes(p.sonarrId)
		);
		const toEdit = profiles.filter(
			(p) => modifiedIds.includes(p.filteringProfile.id) && !toCreate.includes(p)
		);
		const totalActions = toRemove.length + toCreate.length + toEdit.length;
		let doneActions = 0;

		await progress(doneActions, totalActions);
		for (const id of toRemove) {
			const res = await conn.deleteQualityProfile(id);
			if (!res.response.ok) {
				console.error(
					`Cannot remove QualityProfile from Sonarr:\n${JSON.stringify(res.error, null, 2)}`
				);
				return { id: 'service.messages.noQualityProfileSonarr' };
			}
			await progress(++doneActions, totalActions);
		}

		const formats = await conn.getCustomFormats();
		if (!formats.success || !formats.data) return { id: 'service.messages.sonarrFetchError' };
		for (const quality of toCreate) {
			const createdQualityProfile = await conn.addQualityProfile(
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
				console.error(
					`Cannot create QualityProfile on Sonarr:\n${JSON.stringify(createdQualityProfile.error, null, 2)}`
				);
				continue;
			}
			quality.sonarrId = createdQualityProfile.data.id;
			await quality.save();
			await progress(++doneActions, totalActions);
		}

		for (const quality of toEdit) {
			const sonarrProfile = sonarrData.find((p) => p.id === quality.sonarrId);
			if (!sonarrProfile || !sonarrProfile.items || !quality.sonarrId) {
				console.error(`Cannot update QualityProfile with id ${quality.sonarrId} on Sonarr`);
				continue;
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
				console.error(
					`Cannot update QualityProfile with id ${quality.sonarrId} on Sonarr:`,
					JSON.stringify(res.error, null, 2)
				);
				continue;
			}
			await progress(++doneActions, totalActions);
		}
	}
}
