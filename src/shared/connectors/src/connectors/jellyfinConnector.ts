import createClient, { type Client } from 'openapi-fetch';
import type { paths } from '../generated/jellyfin.generated.js';
import { JellyfinDeviceProfile } from '../types/jellyfinTypes.js';
import Logger, { LogLevel } from '@reiverr/logging';

const logger = Logger.getLogger('JellyfinRemote');

export class JellyfinConnector {
	private client: Client<paths>;
	private url: string;

	public static JELLYFIN_CLIENT = 'Reiverr Web Client';

	public constructor(baseUrl: string, apiKey: string) {
		this.client = createClient<paths>({
			baseUrl: baseUrl,
			headers: {
				Authorization: `MediaBrowser Token="${apiKey}"`
			}
		});
		this.url = baseUrl;
	}

	public async isHealthy() {
		try {
			const health = await this.client.GET('/System/Info');
			return health.response.ok;
		} catch (e) {
			logger.log(LogLevel.WARNING, `Cannot connect to Jellyfin: ${e}`);
			return false;
		}
	}

	public async isUserConnected(accessToken: string) {
		try {
			return await createClient<paths>({
				baseUrl: this.url,
				headers: {
					Authorization: `MediaBrowser Token="${accessToken}"`
				}
			}).GET('/Users/Me');
		} catch (e) {
			logger.log(LogLevel.WARNING, `Cannot connect to Jellyfin: ${e}`);
			return undefined;
		}
	}

	public async postUsersAuthenticateByName(
		username: string,
		password: string,
		device: string,
		version: string
	) {
		try {
			return await createClient<paths>({
				baseUrl: this.url,
				headers: {
					Authorization: `MediaBrowser Client=${JellyfinConnector.JELLYFIN_CLIENT}, Device=${device}, DeviceId=${await JellyfinConnector.getDeviceId(username)}, Version=${version}`
				}
			}).POST('/Users/AuthenticateByName', {
				body: {
					Username: username,
					Pw: password
				}
			});
		} catch (e) {
			logger.log(LogLevel.WARNING, `Cannot connect to Jellyfin: ${e}`);
			return undefined;
		}
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

	public async postUserItemsByIdUserData(
		userId: string,
		itemId: string,
		playbackPositionTicks: number
	) {
		return this.client.POST('/UserItems/{itemId}/UserData', {
			params: { path: { itemId }, query: { userId } },
			body: { PlaybackPositionTicks: playbackPositionTicks }
		});
	}

	public async postItemsByIdPlaybackInfo(
		userId: string,
		itemId: string,
		maxStreamingBitrate: number,
		startTimeTicks: number,
		deviceProfile: JellyfinDeviceProfile
	) {
		return this.client.POST('/Items/{itemId}/PlaybackInfo', {
			params: {
				path: { itemId }
			},
			body: {
				UserId: userId,
				MaxStreamingBitrate: maxStreamingBitrate,
				StartTimeTicks: startTimeTicks,
				DeviceProfile: deviceProfile,
				AutoOpenLiveStream: true
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
