import type {
	components as RadarrComponents,
	paths as RadarrPaths
} from '$lib/apis/radarr/radarr.generated';
import createClient, { type Client } from 'openapi-fetch';
import type { Result } from '$lib/types';

export class RadarrConnector {
	private client: Client<RadarrPaths>;

	public constructor(baseUrl: string, apiKey: string) {
		this.client = createClient<RadarrPaths>({
			baseUrl: baseUrl,
			headers: {
				'X-Api-Key': apiKey
			}
		});
	}

	public async isHealthy(): Promise<boolean> {
		try {
			const health = await this.client.GET('/api/v3/health');
			return health.response.ok;
		} catch (e) {
			void e;
			return false;
		}
	}

	public async postCustomFormat(
		customFormat: RadarrComponents['schemas']['CustomFormatResource']
	) {
		return await this.client.POST('/api/v3/customformat', {
			body: customFormat
		});
	}

	public async postQualityProfile(
		qualityProfile: RadarrComponents['schemas']['QualityProfileResource']
	) {
		return await this.client.POST('/api/v3/qualityprofile', {
			body: qualityProfile
		});
	}

	public async postMovie(movieResource: RadarrComponents['schemas']['MovieResource']) {
		return await this.client.POST('/api/v3/movie', {
			body: movieResource
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

	public async getCustomFormats(): Promise<
		Result<RadarrComponents['schemas']['CustomFormatResource'][]>
	> {
		const formats = await this.client.GET('/api/v3/customformat');

		return { success: true, data: formats.data };
	}

	public async getQualityProfile(): Promise<
		Result<RadarrComponents['schemas']['QualityProfileResource'][]>
	> {
		const profiles = await this.client.GET('/api/v3/qualityprofile');

		return { success: true, data: profiles.data };
	}

	public async getRootFolder() {
		return await this.client.GET('/api/v3/rootfolder');
	}

	public async getQueue() {
		return await this.client.GET('/api/v3/queue', {
			params: { query: { includeMovie: true, pageSize: 20 } }
		});
	}

	public async getMovie() {
		return await this.client.GET('/api/v3/movie');
	}

	public async getDiskSpace() {
		return await this.client.GET('/api/v3/diskspace');
	}

	public async putQualityProfile(
		id: number,
		profile: RadarrComponents['schemas']['QualityProfileResource']
	) {
		return await this.client.PUT('/api/v3/qualityprofile/{id}', {
			params: { path: { id: id.toString() } },
			body: profile
		});
	}

	public async deleteCustomFormatBulk(ids: number[]) {
		return await this.client.DELETE('/api/v3/customformat/bulk', { body: { ids } });
	}

	public async deleteQualityProfile(id: number) {
		return await this.client.DELETE('/api/v3/qualityprofile/{id}', {
			params: { path: { id } }
		});
	}

	public async deleteMovie(id: number) {
		return await this.client.DELETE('/api/v3/movie/{id}', {
			params: { path: { id }, query: { deleteFiles: true } }
		});
	}
}
