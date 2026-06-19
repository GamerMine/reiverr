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

	public async getItems(
		userId: string,
		hasTmdbId: boolean | undefined,
		includeItemTypes: ('Movie' | 'Series' | 'Episode')[]
	) {
		return await this.client.GET('/Items', {
			params: {
				query: {
					userId,
					hasTmdbId,
					recursive: true,
					includeItemTypes,
					fields: ['ProviderIds', 'Genres', 'DateLastMediaAdded', 'DateCreated']
				}
			}
		});
	}

	public async getUserImage(userId: string) {
		return await this.client.GET('/UserImage', {
			params: { query: { userId, format: 'Png', width: 26 * 10 } },
			parseAs: 'blob'
		});
	}

	public async postUserPlayedItems(userId: string, itemId: string) {
		return await this.client.POST('/UserPlayedItems/{itemId}', {
			params: { path: { itemId }, query: { userId, datePlayed: new Date().toISOString() } }
		});
	}

	public async deleteUserPlayedItems(userId: string, itemId: string) {
		return await this.client.DELETE('/UserPlayedItems/{itemId}', {
			params: { path: { itemId }, query: { userId } }
		});
	}
}
