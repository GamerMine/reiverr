import createClient, { type Client } from 'openapi-fetch';
import type { paths } from '../generated/jellyfin.generated.js';

export class JellyfinConnector {
	private client: Client<paths>;

	public static JELLYFIN_CLIENT = 'Reiverr Web Client';

	public constructor(baseUrl: string, apiKey: string) {
		this.client = createClient<paths>({
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

	public async getItemById(userId: string, itemId: string) {
		return this.client.GET('/Items/{itemId}', {
			params: {
				path: { itemId },
				query: {
					userId
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

	public async getUsers() {
		return await this.client.GET('/Users', {
			params: {
				query: {
					isHidden: false,
					isDisabled: false
				}
			}
		});
	}

	public async getUserItemsResume(userId: string) {
		return await this.client.GET('/UserItems/Resume', {
			params: {
				query: {
					userId,
					mediaTypes: ['Video'],
					fields: ['ProviderIds', 'Genres']
				}
			}
		});
	}

	public async getShowsNextUp(userId: string) {
		return await this.client.GET('/Shows/NextUp', {
			params: {
				query: {
					userId,
					fields: ['ProviderIds', 'Genres']
				}
			}
		});
	}

	public async postUserPlayedItems(userId: string, itemId: string) {
		return await this.client.POST('/UserPlayedItems/{itemId}', {
			params: { path: { itemId }, query: { userId, datePlayed: new Date().toISOString() } }
		});
	}

	public async postSessionsPlaying(itemId: string, playSessionId: string, mediaSourceId: string) {
		return await this.client.POST('/Sessions/Playing', {
			body: {
				CanSeek: true,
				ItemId: itemId,
				PlaySessionId: playSessionId,
				MediaSourceId: mediaSourceId,
				AudioStreamIndex: 1,
				SubtitleStreamIndex: -1
			}
		});
	}

	public async postSessionsPlayingProgress(
		itemId: string,
		playSessionId: string,
		mediaSourceId: string,
		isPaused: boolean,
		positionTicks: number
	) {
		return await this.client.POST('/Sessions/Playing/Progress', {
			body: {
				CanSeek: true,
				ItemId: itemId,
				MediaSourceId: mediaSourceId,
				IsPaused: isPaused,
				PositionTicks: positionTicks,
				PlaySessionId: playSessionId
			}
		});
	}

	public async postSessionsPlayingStopped(
		itemId: string,
		playSessionId: string,
		mediaSourceId: string,
		positionTicks: number
	) {
		return await this.client.POST('/Sessions/Playing/Stopped', {
			body: {
				ItemId: itemId,
				MediaSourceId: mediaSourceId,
				PositionTicks: positionTicks,
				PlaySessionId: playSessionId
			}
		});
	}

	public async deleteUserPlayedItems(userId: string, itemId: string) {
		return await this.client.DELETE('/UserPlayedItems/{itemId}', {
			params: { path: { itemId }, query: { userId } }
		});
	}

	public async deleteVideosActiveEncodings(username: string, playSessionId: string) {
		return await this.client.DELETE('/Videos/ActiveEncodings', {
			params: {
				query: {
					deviceId: await JellyfinConnector.getDeviceId(username),
					playSessionId: playSessionId
				}
			}
		});
	}

	public static async getDeviceId(username: string) {
		return await JellyfinConnector.getSHA256Hash(username + JellyfinConnector.JELLYFIN_CLIENT);
	}

	private static async getSHA256Hash(input: string) {
		const textAsBuffer = new TextEncoder().encode(input);
		const hashBuffer = await crypto.subtle.digest('SHA-256', textAsBuffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((item) => item.toString(16).padStart(2, '0')).join('');
	}
}
