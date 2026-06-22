import type { TaskExecutor, TaskProgressCallback, TaskQueueCallback } from '../scheduler.server';
import { SeriesAddSchema } from '../types.ts';
import * as v from 'valibot';
import {
	FilteringProfilesEntity,
	GlobalSettingsEntity,
	QualityProfilesEntity
} from '@reiverr/db/entities';
import Connectors from '@reiverr/connectors';
import { SonarrMapper } from '@reiverr/connectors/mappers';
import type { MessageObject } from '@reiverr/db/types';

export class SonarrSeriesAdd implements TaskExecutor {
	async computeDescription(data: unknown): Promise<MessageObject> {
		const series = v.parse(SeriesAddSchema, data);
		return {
			id: 'service.tasks.sonarrAddSeries.addingSeries',
			values: { tvdbId: series.tvdbId, language: series.language }
		};
	}

	async computeExecutionDescription(data: unknown): Promise<MessageObject> {
		const series = v.parse(SeriesAddSchema, data);
		return {
			id: 'service.tasks.sonarrAddSeries.addingSeries',
			values: { tvdbId: series.tvdbId, language: series.language }
		};
	}

	async queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | MessageObject> {
		await queue(data);
	}

	async execute(data: unknown, progress: TaskProgressCallback): Promise<void | MessageObject> {
		const series = v.parse(SeriesAddSchema, data);
		const { sonarrConnector } = await Connectors.getInstance();
		await progress(0, 1);

		const settings = await GlobalSettingsEntity.getDefault();
		if (!settings.sonarrRootFolderPath) {
			console.error('Sonarr root folder is missing.');
			return { id: 'general.unknownError' };
		}

		const defaultFp = await FilteringProfilesEntity.getDefaultProfile();
		if (!defaultFp) return { id: 'settings.misc.noDefaultFilteringProfile' };

		const qp = await QualityProfilesEntity.findOne({
			relations: { customFormat: true, filteringProfile: true },
			where: {
				customFormat: { lang: series.language },
				filteringProfile: { id: defaultFp.id }
			},
			select: { id: true, sonarrId: true }
		});
		if (!qp || !qp.sonarrId)
			return { id: 'service.tasks.sonarrAddSeries.noQualityProfileFound' };

		const res = await sonarrConnector?.postSeries(
			SonarrMapper.seriesResource(
				series.tvdbId,
				qp.sonarrId,
				settings.sonarrRootFolderPath,
				series.seasons.map((s) => ({ seasonNumber: s.seasonNumber, monitored: s.checked }))
			)
		);
		if (!res || !res.response.ok || !res.data?.id) {
			console.error(
				`Cannot add series ${series.tvdbId} on Sonarr:`,
				res ? JSON.stringify(res.error, null, 2) : 'Unable to connect to Sonarr.'
			);
			return { id: 'general.unknownError' };
		}

		let created = false;
		for (let i = 0; i < 5; i++) {
			await new Promise((f) => setTimeout(f, 1000));
			const poll = await sonarrConnector?.getSeriesId(res.data.id);
			if (poll && poll.response.ok) {
				created = true;
				break;
			}
		}
		if (!created) {
			console.error(
				`Cannot add series ${series.tvdbId} on Sonarr:`,
				'Series creation time out'
			);
			return { id: 'general.unknownError' };
		}

		const sonarrEpisodes = await sonarrConnector?.getEpisode(res.data.id);
		if (!sonarrEpisodes || !sonarrEpisodes.data) {
			console.error(
				`Cannot add series ${series.tvdbId} on Sonarr:`,
				res ? JSON.stringify(res.error, null, 2) : 'Unable to connect to Sonarr.'
			);
			return { id: 'general.unknownError' };
		}
		series.seasons = series.seasons.filter((s) => !s.checked);
		series.seasons.forEach((s) => (s.episodes = s.episodes.filter((e) => e.checked)));

		const episodesIdsToMonitor: number[] = [];
		for (const season of series.seasons) {
			if (season.episodes.length === 0) continue;
			const filteredSonarrEpisodes = sonarrEpisodes.data.filter(
				(e) => e.seasonNumber === season.seasonNumber
			);
			for (const episode of season.episodes) {
				const sonarrEpisode = filteredSonarrEpisodes.find(
					(e) => e.episodeNumber === episode.episodeNumber
				);
				if (!sonarrEpisode || !sonarrEpisode.id) {
					console.warn(
						`Episode ${episode.episodeNumber} of season ${season.seasonNumber} not found.`
					);
					continue;
				}
				episodesIdsToMonitor.push(sonarrEpisode.id);
			}
		}

		const res2 = await sonarrConnector?.putEpisodeMonitor(
			SonarrMapper.episodesMonitoredResource(episodesIdsToMonitor)
		);
		if (!res2 || !res2.response.ok) {
			console.error(
				`Cannot add series ${series.tvdbId} on Sonarr:`,
				res2 ? JSON.stringify(res2.error, null, 2) : 'Unable to connect to Sonarr.'
			);
			return { id: 'general.unknownError' };
		}

		await progress(1, 1);
	}
}
