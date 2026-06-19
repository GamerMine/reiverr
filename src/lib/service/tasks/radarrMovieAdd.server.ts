import type {
	TaskExecutor,
	TaskProgressCallback,
	TaskQueueCallback
} from '$lib/service/scheduler.server';
import type { MessageObject } from '$lib/types';
import * as v from 'valibot';
import {
	FilteringProfilesEntity,
	GlobalSettingsEntity,
	QualityProfilesEntity
} from '@reiverr/db/entities';
import Connectors from '@reiverr/connectors';
import { RadarrMapper } from '@reiverr/connectors/mappers';

const MovieAddSchema = v.object({ tmdbId: v.number(), language: v.string() });

export class RadarrMovieAdd implements TaskExecutor {
	async computeDescription(data: unknown): Promise<MessageObject> {
		const movie = v.parse(MovieAddSchema, data);
		return {
			id: 'service.tasks.radarrAddMovie.addingMovie',
			values: { tmdbId: movie.tmdbId, language: movie.language }
		};
	}

	async computeExecutionDescription(data: unknown): Promise<MessageObject> {
		const movie = v.parse(MovieAddSchema, data);
		return {
			id: 'service.tasks.radarrAddMovie.addingMovie',
			values: { tmdbId: movie.tmdbId, language: movie.language }
		};
	}

	async queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | MessageObject> {
		await queue(data);
	}

	async execute(data: unknown, progress: TaskProgressCallback): Promise<void | MessageObject> {
		const movie = v.parse(MovieAddSchema, data);
		const { radarrConnector } = await Connectors.getInstance();
		await progress(0, 1);

		const settings = await GlobalSettingsEntity.getDefault();
		if (!settings.radarrRootFolderPath) {
			console.error('Radarr root folder is missing.');
			return { id: 'general.unknownError' };
		}

		const defaultFp = await FilteringProfilesEntity.getDefaultProfile();
		if (!defaultFp) return { id: 'settings.misc.noDefaultFilteringProfile' };

		const qp = await QualityProfilesEntity.findOne({
			relations: { customFormat: true, filteringProfile: true },
			where: {
				customFormat: { lang: movie.language },
				filteringProfile: { id: defaultFp.id }
			},
			select: { id: true, radarrId: true }
		});
		if (!qp || !qp.radarrId)
			return { id: 'service.tasks.radarrAddMovie.noQualityProfileFound' };

		const res = await radarrConnector?.postMovie(
			RadarrMapper.movieResource(movie.tmdbId, qp.radarrId, settings.radarrRootFolderPath)
		);
		if (!res || !res.response.ok) {
			console.error(
				`Cannot add movie ${movie.tmdbId} on Radarr:`,
				res ? JSON.stringify(res.error, null, 2) : 'Unable to connect to Radarr.'
			);
			return { id: 'general.unknownError' };
		}
		await progress(1, 1);
	}
}
