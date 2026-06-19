import type { paths } from '../generated/sonarr.generated';
import createClient, { type Client } from 'openapi-fetch';
import type {
	SonarrCustomFormatResource,
	SonarrEpisodesMonitoredResource,
	SonarrQualityProfileResource,
	SonarrSeriesResource
} from '../types/sonarrTypes';

export class SonarrConnector {
	private client: Client<paths>;

	public constructor(baseUrl: string, apiKey: string) {
		this.client = createClient<paths>({
			baseUrl: baseUrl,
			headers: {
				'X-Api-Key': apiKey
			}
		});
	}

	public async isHealthy(): Promise<boolean> {
		const health = await this.client.GET('/api/v3/health');
		return health.response.ok;
	}

	public async postCustomFormat(customFormat: SonarrCustomFormatResource) {
		return await this.client.POST('/api/v3/customformat', {
			body: customFormat
		});
	}

	public async postQualityProfile(qualityProfile: SonarrQualityProfileResource) {
		return await this.client.POST('/api/v3/qualityprofile', {
			body: qualityProfile
		});
	}

	public async postSeries(seriesResource: SonarrSeriesResource) {
		return await this.client.POST('/api/v3/series', {
			body: seriesResource
		});
	}

	public async postCommand(command: 'RefreshMonitoredDownloads') {
		return await this.client.POST('/api/v3/command', { body: { name: command } });
	}

	public async getQualityDefinitions() {
		return await this.client.GET('/api/v3/qualitydefinition');
	}

	public async getLanguage() {
		return await this.client.GET('/api/v3/language');
	}

	public async getCustomFormats() {
		const formats = await this.client.GET('/api/v3/customformat');

		return { success: true, data: formats.data };
	}

	public async getQualityProfile() {
		const profiles = await this.client.GET('/api/v3/qualityprofile');

		return { success: true, data: profiles.data };
	}

	public async getRootFolder() {
		return await this.client.GET('/api/v3/rootfolder');
	}

	public async getSeries() {
		return await this.client.GET('/api/v3/series');
	}

	public async getSeriesId(id: number) {
		return await this.client.GET('/api/v3/series/{id}', {
			params: { path: { id } }
		});
	}

	public async getEpisode(seriesId: number) {
		return await this.client.GET('/api/v3/episode', {
			params: { query: { seriesId } }
		});
	}

	public async getQueue() {
		return await this.client.GET('/api/v3/queue', {
			params: { query: { pageSize: 20, includeEpisode: true, includeSeries: true } }
		});
	}

	public async getDiskSpace() {
		return await this.client.GET('/api/v3/diskspace');
	}

	public async putQualityProfile(id: number, profile: SonarrQualityProfileResource) {
		return await this.client.PUT('/api/v3/qualityprofile/{id}', {
			params: { path: { id: id.toString() } },
			body: profile
		});
	}

	public async putEpisodeMonitor(episodesMonitoredResource: SonarrEpisodesMonitoredResource) {
		return await this.client.PUT('/api/v3/episode/monitor', {
			body: episodesMonitoredResource
		});
	}

	public async deleteCustomFormatBulk(ids: number[]) {
		return await this.client.DELETE('/api/v3/customformat/bulk', {
			body: {
				ids
			}
		});
	}

	public async deleteQualityProfile(id: number) {
		return await this.client.DELETE('/api/v3/qualityprofile/{id}', {
			params: {
				path: {
					id
				}
			}
		});
	}

	public async deleteSeries(id: number) {
		return await this.client.DELETE('/api/v3/series/{id}', {
			params: { path: { id } },
			query: { deleteFiles: true }
		});
	}
}
