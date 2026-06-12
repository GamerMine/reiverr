import createClient, { type Client } from 'openapi-fetch';
import type { paths as JellyfinPaths } from '$lib/apis/jellyfin/jellyfin.generated';

export class JellyfinConnector {
	private client: Client<JellyfinPaths>;

	public constructor(baseUrl: string, apiKey: string) {
		this.client = createClient<JellyfinPaths>({
			baseUrl: baseUrl,
			headers: {
				Authorization: `MediaBrowser Token="${apiKey}"`
			}
		});
	}

	public async getItems(userId: string) {
		return await this.client.GET('/Items', {
			params: {
				query: {
					userId,
					hasTmdbId: true,
					recursive: true,
					includeItemTypes: ['Movie', 'Series'],
					fields: ['ProviderIds', 'Genres', 'DateLastMediaAdded', 'DateCreated']
				}
			}
		});
	}
}
