import type { TaskExecutor, TaskQueueCallback } from '../scheduler.server';
import * as v from 'valibot';
import {
	FilteringProfilesEntity,
	GlobalSettingsEntity,
	QualityProfilesEntity
} from '@reiverr/db/entities';
import Connectors from '@reiverr/connectors';
import { RadarrMapper } from '@reiverr/connectors/mappers';
import { MovieAddSchema } from '../types.ts';
import Logger, { LogLevel } from '@reiverr/logging';

const logger = Logger.getLogger('Task:RadarrMovieAdd');

export class RadarrMovieAdd implements TaskExecutor {
	async queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | string> {
		await queue(data);
	}

	async execute(data: unknown): Promise<void | string> {
		const movie = v.parse(MovieAddSchema, data);
		const { radarrConnector } = await Connectors.getInstance();

		const settings = await GlobalSettingsEntity.getDefault();
		if (!settings.radarrRootFolderPath) {
			const err = 'Radarr root folder is missing.';
			logger.log(LogLevel.ERROR, err);
			return err;
		}

		const defaultFp = await FilteringProfilesEntity.getDefaultProfile(movie.userId);
		if (!defaultFp) {
			const err = 'No default filtering profile found.';
			logger.log(LogLevel.ERROR, err);
			return err;
		}

		const qp = await QualityProfilesEntity.findOne({
			relations: { customFormat: true, filteringProfile: true },
			where: {
				customFormat: { lang: movie.language },
				filteringProfile: { id: defaultFp.id }
			},
			select: { id: true, radarrId: true }
		});
		if (!qp || !qp.radarrId) {
			const err = 'No quality profile matching filtering profile found.';
			logger.log(LogLevel.ERROR, err);
			return err;
		}

		const res = await radarrConnector?.postMovie(
			RadarrMapper.movieResource(movie.tmdbId, qp.radarrId, settings.radarrRootFolderPath)
		);
		if (!res.response.ok) {
			const err = `Cannot add movie ${movie.tmdbId} on Radarr: ${JSON.stringify(res.error, null, 2)}`;
			logger.log(LogLevel.ERROR, err);
			return err;
		}
	}
}
