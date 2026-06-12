import { BaseEntity, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { defaultGlobalSettings, type GlobalSettings } from '@reiverr/db/types';
import { CustomFormatsEntity } from '@reiverr/db/entities';

@Entity({ name: 'globalSettings' })
export class GlobalSettingsEntity extends BaseEntity {
	@PrimaryColumn('text')
	name: string;

	// General
	@OneToMany(() => CustomFormatsEntity, (entity) => entity.globalSettings)
	downloadLanguages: CustomFormatsEntity[];

	// Sonarr
	@Column('text', { nullable: true, default: defaultGlobalSettings.sonarr.baseUrl })
	sonarrBaseUrl: string | null;

	@Column('text', { nullable: true, default: defaultGlobalSettings.sonarr.apiKey })
	sonarrApiKey: string | null;

	@Column('text', { nullable: true, default: defaultGlobalSettings.sonarr.rootFolderPath })
	sonarrRootFolderPath: string | null;

	// Radarr
	@Column('text', { nullable: true, default: defaultGlobalSettings.radarr.baseUrl })
	radarrBaseUrl: string | null;

	@Column('text', { nullable: true, default: defaultGlobalSettings.radarr.apiKey })
	radarrApiKey: string | null;

	@Column('text', { nullable: true, default: defaultGlobalSettings.radarr.rootFolderPath })
	radarrRootFolderPath: string | null;

	// Jellyfin
	@Column('text')
	jellyfinBaseUrl: string;

	@Column('text')
	jellyfinApiKey: string;

	public static async getDefault(name = 'default') {
		const settings = await this.findOne({
			where: { name },
			relations: { downloadLanguages: true }
		});

		if (!settings) {
			const defaultSettings = new GlobalSettingsEntity();
			defaultSettings.name = 'default';
			return await defaultSettings.save();
		}

		return settings;
	}

	public static async getClient(name = 'default'): Promise<GlobalSettings> {
		const settings = await this.findOne({
			where: { name },
			relations: { downloadLanguages: true }
		});

		if (!settings) {
			const defaultSettings = new GlobalSettingsEntity();
			defaultSettings.name = 'default';
			await defaultSettings.save();
			return this.get(defaultSettings);
		}

		return this.get(settings);
	}

	public static async getJellyfinApi(name = 'default') {
		const settings = await this.findOne({ where: { name } });
		if (!settings) throw 'Jellyfin API not found';

		return {
			apiUrl: settings.jellyfinBaseUrl,
			apiKey: settings.jellyfinApiKey
		};
	}

	public static async getJellyfinBaseUrl(name = 'default') {
		const settings = await this.findOne({ where: { name } });

		if (!settings) {
			const defaultSettings = new GlobalSettingsEntity();
			defaultSettings.name = 'default';
			await defaultSettings.save();
			return null;
		}

		return settings.jellyfinBaseUrl ?? undefined;
	}

	public static async getJellyfinApiKey(name = 'default') {
		const settings = await this.findOne({ where: { name } });

		if (!settings) {
			const defaultSettings = new GlobalSettingsEntity();
			defaultSettings.name = 'default';
			await defaultSettings.save();
			return null;
		}

		return settings.jellyfinApiKey ?? undefined;
	}

	public static async getRadarrApi(name = 'default') {
		const settings = await this.findOne({ where: { name } });

		if (!settings) {
			const defaultSettings = new GlobalSettingsEntity();
			defaultSettings.name = 'default';
			await defaultSettings.save();
			return undefined;
		}

		return {
			apiUrl: settings.radarrBaseUrl ?? undefined,
			apiKey: settings.radarrApiKey ?? undefined
		};
	}

	public static async getRadarrBaseUrl(name = 'default') {
		return (await GlobalSettingsEntity.getRadarrApi(name))?.apiUrl ?? undefined;
	}

	public static async getRadarrApiKey(name = 'default') {
		return (await GlobalSettingsEntity.getRadarrApi(name))?.apiKey ?? undefined;
	}

	public static async getSonarrApi(name = 'default') {
		const settings = await this.findOne({ where: { name } });

		if (!settings) {
			const defaultSettings = new GlobalSettingsEntity();
			defaultSettings.name = 'default';
			await defaultSettings.save();
			return undefined;
		}

		return {
			apiUrl: settings.sonarrBaseUrl ?? undefined,
			apiKey: settings.sonarrApiKey ?? undefined
		};
	}

	public static async getSonarrBaseUrl(name = 'default') {
		return (await GlobalSettingsEntity.getSonarrApi(name))?.apiUrl ?? undefined;
	}

	public static async getSonarrApiKey(name = 'default') {
		return (await GlobalSettingsEntity.getSonarrApi(name))?.apiKey ?? undefined;
	}

	public static async getDownloadLanguages(name = 'default') {
		const settings = await this.findOne({ where: { name } });

		if (!settings) {
			const defaultSettings = new GlobalSettingsEntity();
			defaultSettings.name = 'default';
			await defaultSettings.save();
			return [];
		}

		return settings.downloadLanguages ?? [];
	}

	static get(settings: GlobalSettingsEntity): GlobalSettings {
		return {
			...defaultGlobalSettings,

			general: {
				downloadLanguages: settings.downloadLanguages.map((e) => e.lang)
			},
			sonarr: {
				...defaultGlobalSettings.sonarr,
				baseUrl: settings.sonarrBaseUrl ?? undefined,
				rootFolderPath: settings.sonarrRootFolderPath ?? undefined
			},
			radarr: {
				...defaultGlobalSettings.radarr,
				baseUrl: settings.radarrBaseUrl ?? undefined,
				rootFolderPath: settings.radarrRootFolderPath ?? undefined
			},
			jellyfin: {
				...defaultGlobalSettings.jellyfin,
				baseUrl: settings.jellyfinBaseUrl ?? undefined
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

		if (values.sonarr.apiKey) {
			settings.sonarrApiKey = values.sonarr.apiKey;
		} else if (!values.sonarr.baseUrl) {
			settings.sonarrApiKey = values.sonarr.apiKey ?? null;
		}
		settings.sonarrBaseUrl = values.sonarr.baseUrl ?? null;
		settings.sonarrRootFolderPath = values.sonarr.rootFolderPath ?? null;

		if (values.radarr.apiKey) {
			settings.radarrApiKey = values.radarr.apiKey;
		} else if (!values.radarr.baseUrl) {
			settings.radarrApiKey = values.radarr.apiKey ?? null;
		}
		settings.radarrBaseUrl = values.radarr.baseUrl ?? null;
		settings.radarrRootFolderPath = values.radarr.rootFolderPath ?? null;

		if (values.jellyfin.apiKey) {
			settings.jellyfinApiKey = values.jellyfin.apiKey;
		} else if (!values.jellyfin.baseUrl && values.jellyfin.apiKey) {
			settings.jellyfinApiKey = values.jellyfin.apiKey;
		}
		settings.jellyfinBaseUrl = values.jellyfin.baseUrl;

		await settings.save();

		return settings;
	}

	public static async setJellyfinApiEndpoint(baseURL: string, apiKey: string, name = 'default') {
		let settings = await this.findOne({ where: { name } });

		if (!settings) {
			settings = new GlobalSettingsEntity();
			settings.name = 'default';
		}

		settings.jellyfinBaseUrl = baseURL;
		settings.jellyfinApiKey = apiKey;

		await settings.save();
	}
}
