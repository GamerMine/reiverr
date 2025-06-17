import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';
import { defaultGlobalSettings, type GlobalSettings } from '$lib/entities/Types';

@Entity({ name: 'globalSettings' })
export class GlobalSettingsEntity extends BaseEntity {
	@PrimaryColumn('text')
	name: string;

	// Sonarr

	@Column('text', { nullable: true, default: defaultGlobalSettings.sonarr.baseUrl })
	sonarrBaseUrl: string | null;

	@Column('text', { nullable: true, default: defaultGlobalSettings.sonarr.apiKey })
	sonarrApiKey: string | null;

	@Column('text', { default: defaultGlobalSettings.sonarr.rootFolderPath })
	sonarrRootFolderPath: string;

	@Column('integer', { default: defaultGlobalSettings.sonarr.qualityProfileId })
	sonarrQualityProfileId: number;

	@Column('integer', { default: defaultGlobalSettings.sonarr.languageProfileId })
	sonarrLanguageProfileId: number;

	@Column('integer', { default: defaultGlobalSettings.sonarr.monitor })
	sonarrMonitor: number;

	@Column('boolean', { default: defaultGlobalSettings.sonarr.StartSearch })
	sonarrStartSearch: boolean;

	// Radarr

	@Column('text', { nullable: true, default: defaultGlobalSettings.radarr.baseUrl })
	radarrBaseUrl: string | null;

	@Column('text', { nullable: true, default: defaultGlobalSettings.radarr.apiKey })
	radarrApiKey: string | null;

	@Column('text', { default: defaultGlobalSettings.radarr.rootFolderPath })
	radarrRootFolderPath: string;

	@Column('integer', { default: defaultGlobalSettings.radarr.qualityProfileId })
	radarrQualityProfileId: number;

	@Column('integer', { default: defaultGlobalSettings.radarr.monitor })
	radarrMonitor: number;

	@Column('boolean', { default: defaultGlobalSettings.radarr.startSearch })
	radarrStartSearch: boolean;

	// Jellyfin

	@Column('text', { nullable: true, default: defaultGlobalSettings.jellyfin.baseUrl })
	jellyfinBaseUrl: string | null;

	@Column('text', { nullable: true, default: defaultGlobalSettings.jellyfin.apiKey })
	jellyfinApiKey: string | null;

	public static async getClient(name = 'default'): Promise<GlobalSettings> {
		const settings = await this.findOne({ where: { name } });

		if (!settings) {
			const defaultSettings = new GlobalSettingsEntity();
			defaultSettings.name = 'default';
			await defaultSettings.save();
			return this.getSettings(defaultSettings);
		}

		return this.getSettings(settings);
	}

	public static async getJellyfinApiKey(name = 'default') {
		const settings = await this.findOne({ where: { name } });

		if (!settings) {
			const defaultSettings = new GlobalSettingsEntity();
			defaultSettings.name = 'default';
			await defaultSettings.save();
			return null;
		}

		return settings.jellyfinApiKey;
	}

	public static async getJellyfinBaseUrl(name = 'default') {
		const settings = await this.findOne({ where: { name } });

		if (!settings) {
			const defaultSettings = new GlobalSettingsEntity();
			defaultSettings.name = 'default';
			await defaultSettings.save();
			return null;
		}

		return settings.jellyfinBaseUrl;
	}

	static getSettings(settings: GlobalSettingsEntity): GlobalSettings {
		return {
			...defaultGlobalSettings,

			sonarr: {
				...defaultGlobalSettings.sonarr,
				apiKey: settings.sonarrApiKey,
				baseUrl: settings.sonarrBaseUrl,
				monitor: settings.sonarrMonitor,
				StartSearch: settings.sonarrStartSearch,
				languageProfileId: settings.sonarrLanguageProfileId,
				qualityProfileId: settings.sonarrQualityProfileId,
				rootFolderPath: settings.sonarrRootFolderPath
			},
			radarr: {
				...defaultGlobalSettings.radarr,
				apiKey: settings.radarrApiKey,
				baseUrl: settings.radarrBaseUrl,
				monitor: settings.radarrMonitor,
				startSearch: settings.radarrStartSearch,
				qualityProfileId: settings.radarrQualityProfileId,
				rootFolderPath: settings.radarrRootFolderPath
			},
			jellyfin: {
				...defaultGlobalSettings.jellyfin,
				baseUrl: settings.jellyfinBaseUrl
			},
			initialised: true
		};
	}

	public static async set(
		name: string,
		values: GlobalSettings
	): Promise<GlobalSettingsEntity | null> {
		const settings = await this.findOne({ where: { name } });

		if (!settings) return null;

		settings.sonarrApiKey = values.sonarr.apiKey;
		settings.sonarrBaseUrl = values.sonarr.baseUrl;
		settings.sonarrLanguageProfileId = values.sonarr.languageProfileId;
		settings.sonarrQualityProfileId = values.sonarr.qualityProfileId;
		settings.sonarrRootFolderPath = values.sonarr.rootFolderPath;
		settings.sonarrMonitor = values.sonarr.monitor;
		settings.sonarrStartSearch = values.sonarr.StartSearch;

		settings.radarrApiKey = values.radarr.apiKey;
		settings.radarrBaseUrl = values.radarr.baseUrl;
		settings.radarrQualityProfileId = values.radarr.qualityProfileId;
		settings.radarrRootFolderPath = values.radarr.rootFolderPath;
		settings.radarrMonitor = values.radarr.monitor;
		settings.radarrStartSearch = values.radarr.startSearch;

		if (values.jellyfin.apiKey) {
			settings.jellyfinApiKey = values.jellyfin.apiKey;
		} else if (!values.jellyfin.baseUrl) {
			settings.jellyfinApiKey = values.jellyfin.apiKey;
		}
		settings.jellyfinBaseUrl = values.jellyfin.baseUrl;

		await settings.save();

		return settings;
	}

	public static async setJellyfinApiEndpoint(baseURL: string, apiKey: string, name = 'default') {
		const settings = await this.findOne({ where: { name } });

		if (!settings) return;

		settings.jellyfinBaseUrl = baseURL;
		settings.jellyfinApiKey = apiKey;

		await settings.save();
	}
}
