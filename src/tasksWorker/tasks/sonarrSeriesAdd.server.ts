import type { TaskExecutor, TaskQueueCallback } from '../scheduler.server';
import { SeriesAddSchema } from '../types.ts';
import * as v from 'valibot';
import {
	FilteringProfilesEntity,
	GlobalSettingsEntity,
	QualityProfilesEntity
} from '@reiverr/db/entities';
import Connectors from '@reiverr/connectors';
import { SonarrMapper } from '@reiverr/connectors/mappers';
import Logger, { LogLevel } from '@reiverr/logging';

const logger = Logger.getLogger('Task:SonarrSeriesAdd');

export class SonarrSeriesAdd implements TaskExecutor {
	async queueExecution(data: unknown, queue: TaskQueueCallback): Promise<void | string> {
		await queue(data);
	}

	async execute(data: unknown): Promise<void | string> {
		const series = v.parse(SeriesAddSchema, data);
		const { sonarrConnector } = await Connectors.getInstance();

		const settings = await GlobalSettingsEntity.getDefault();
		if (!settings.sonarrRootFolderPath) {
			const err = 'Sonarr root folder is missing.';
			logger.log(LogLevel.ERROR, err);
			return err;
		}

		const defaultFp = await FilteringProfilesEntity.getDefaultProfile(series.userId);
		if (!defaultFp) {
			const err = 'No default filtering profile found.';
			logger.log(LogLevel.ERROR, err);
			return err;
		}

		const qp = await QualityProfilesEntity.findOne({
			relations: { customFormat: true, filteringProfile: true },
			where: {
				customFormat: { lang: series.language },
				filteringProfile: { id: defaultFp.id }
			},
			select: { id: true, sonarrId: true }
		});
		if (!qp || !qp.sonarrId) {
			const err = 'No quality profile matching filtering profile and language found.';
			logger.log(LogLevel.ERROR, err);
			return err;
		}

		const res = await sonarrConnector?.postSeries(
			SonarrMapper.seriesResource(
				series.tvdbId,
				qp.sonarrId,
				settings.sonarrRootFolderPath,
				series.seasons.map((s) => ({ seasonNumber: s.seasonNumber, monitored: s.checked }))
			)
		);
		if (!res.response.ok || !res.data?.id) {
			const err = `Cannot add series ${series.tvdbId} on Sonarr: ${JSON.stringify(res.error, null, 2)}`;
			logger.log(LogLevel.ERROR, err);
			return err;
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
			const err = `Cannot add series ${series.tvdbId} on Sonarr: Series creation time out`;
			logger.log(LogLevel.ERROR, err);
			return err;
		}

		const sonarrEpisodes = await sonarrConnector?.getEpisode(res.data.id);
		if (!sonarrEpisodes || !sonarrEpisodes.data) {
			const err = `Cannot add series ${series.tvdbId} on Sonarr: ${JSON.stringify(res.error, null, 2)}`;
			logger.log(LogLevel.ERROR, err);
			return err;
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
					logger.log(
						LogLevel.WARNING,
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
		if (!res2.response.ok) {
			const err = `Cannot add series ${series.tvdbId} on Sonarr: ${JSON.stringify(res2.error, null, 2)}`;
			logger.log(LogLevel.ERROR, err);
			return err;
		}
	}
}
