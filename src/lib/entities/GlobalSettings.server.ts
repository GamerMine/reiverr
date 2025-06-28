import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';
import { defaultGlobalSettings, type GlobalSettings } from '$lib/entities/Types';

@Entity({ name: 'globalSettings' })
export class GlobalSettingsEntity extends BaseEntity {
	@PrimaryColumn('text')
	name: string;

	// Sonarr

	@Column('text', { nullable: true, default: defaultGlobalSettings.sonarr.baseUrl })
	sonarrBaseUrl: string | undefined;

	@Column('text', { nullable: true, default: defaultGlobalSettings.sonarr.apiKey })
	sonarrApiKey: string | undefined;

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
	radarrBaseUrl: string | undefined;

	@Column('text', { nullable: true, default: defaultGlobalSettings.radarr.apiKey })
	radarrApiKey: string | undefined;

	@Column('text', { nullable: true, default: defaultGlobalSettings.radarr.rootFolderPath })
	radarrRootFolderPath: string | undefined;

	@Column('text', { nullable: true, default: defaultGlobalSettings.radarr.monitor })
	radarrMonitor: string | undefined;

	@Column('boolean', { default: defaultGlobalSettings.radarr.startSearch })
	radarrStartSearch: boolean;

	// Jellyfin

	@Column('text', { nullable: true, default: defaultGlobalSettings.jellyfin.baseUrl })
	jellyfinBaseUrl: string | undefined;

	@Column('text', { nullable: true, default: defaultGlobalSettings.jellyfin.apiKey })
	jellyfinApiKey: string | undefined;

	public static async getClient(name = 'default'): Promise<GlobalSettings> {
		const settings = await this.findOne({ where: { name } });

		if (!settings) {
			const defaultSettings = new GlobalSettingsEntity();
			defaultSettings.name = 'default';
			await defaultSettings.save();
			return this.get(defaultSettings);
		}

		return this.get(settings);
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

	public static async getRadarrBaseUrl(name = 'default') {
		const settings = await this.findOne({ where: { name } });

		if (!settings) {
			const defaultSettings = new GlobalSettingsEntity();
			defaultSettings.name = 'default';
			await defaultSettings.save();
			return undefined;
		}

		return settings.radarrBaseUrl;
	}

	public static async getRadarrApiKey(name = 'default') {
		const settings = await this.findOne({ where: { name } });

		if (!settings) {
			const defaultSettings = new GlobalSettingsEntity();
			defaultSettings.name = 'default';
			await defaultSettings.save();
			return undefined;
		}

		return settings.radarrApiKey;
	}

	static get(settings: GlobalSettingsEntity): GlobalSettings {
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
				baseUrl: settings.radarrBaseUrl,
				monitor: settings.radarrMonitor,
				startSearch: settings.radarrStartSearch,
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

		if (values.radarr.apiKey) {
			settings.radarrApiKey = values.radarr.apiKey;
		} else if (!values.radarr.baseUrl) {
			settings.radarrApiKey = values.radarr.apiKey;
		}
		settings.radarrBaseUrl = values.radarr.baseUrl;
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

	public static async setRadarrApiEndpoint(
		baseURL: string | undefined,
		apiKey: string | undefined,
		name = 'default'
	) {
		const settings = await this.findOne({ where: { name } });

		if (!settings) return;

		settings.radarrBaseUrl = baseURL;
		settings.radarrApiKey = apiKey;

		await settings.save();
	}

	public static async setRadarrApiConfiguration(
		rootFolderPath: string | undefined,
		monitor: string | undefined,
		startSearch: boolean,
		name = 'default'
	) {
		const settings = await this.findOne({ where: { name } });

		if (!settings) return;

		settings.radarrRootFolderPath = rootFolderPath;
		settings.radarrMonitor = monitor;
		settings.radarrStartSearch = startSearch;

		await settings.save();
	}
}
