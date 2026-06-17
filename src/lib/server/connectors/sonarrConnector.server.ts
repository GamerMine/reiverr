import type {
	components as SonarrComponents,
	paths as SonarrPaths
} from '$lib/apis/sonarr/sonarr.generated';
import createClient, { type Client } from 'openapi-fetch';
import type { Result } from '$lib/types';

export class SonarrConnector {
	private client: Client<SonarrPaths>;

	public constructor(baseUrl: string, apiKey: string) {
		this.client = createClient<SonarrPaths>({
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

	public async postCustomFormat(
		customFormat: SonarrComponents['schemas']['CustomFormatResource']
	) {
		return await this.client.POST('/api/v3/customformat', {
			body: customFormat
		});
	}

	public async postQualityProfile(
		qualityProfile: SonarrComponents['schemas']['QualityProfileResource']
	) {
		return await this.client.POST('/api/v3/qualityprofile', {
			body: qualityProfile
		});
	}

	public async postSeries(seriesResource: SonarrComponents['schemas']['SeriesResource']) {
		return await this.client.POST('/api/v3/series', {
			body: seriesResource
		});
	}

	public async getQualityDefinitions() {
		return await this.client.GET('/api/v3/qualitydefinition');
	}

	public async getLanguage() {
		return await this.client.GET('/api/v3/language');
	}

	public async getCustomFormats(): Promise<
		Result<SonarrComponents['schemas']['CustomFormatResource'][]>
	> {
		const formats = await this.client.GET('/api/v3/customformat');

		return { success: true, data: formats.data };
	}

	public async getQualityProfile(): Promise<
		Result<SonarrComponents['schemas']['QualityProfileResource'][]>
	> {
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

	public async putQualityProfile(
		id: number,
		profile: SonarrComponents['schemas']['QualityProfileResource']
	) {
		return await this.client.PUT('/api/v3/qualityprofile/{id}', {
			params: { path: { id: id.toString() } },
			body: profile
		});
	}

	public async putEpisodeMonitor(
		episodesMonitoredResource: SonarrComponents['schemas']['EpisodesMonitoredResource']
	) {
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
}
