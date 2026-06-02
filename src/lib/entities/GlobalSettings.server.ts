import { BaseEntity, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { defaultGlobalSettings, type GlobalSettings } from '$lib/entities/Types';
import { CustomFormatsEntity } from '$lib/entities/CustomFormats.server';

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
	@Column('text', { nullable: true, default: defaultGlobalSettings.jellyfin.baseUrl })
	jellyfinBaseUrl: string | null;

	@Column('text', { nullable: true, default: defaultGlobalSettings.jellyfin.apiKey })
	jellyfinApiKey: string | null;

	public static async getDefault(name = 'default') {
		return await this.findOne({ where: { name }, relations: { downloadLanguages: true } });
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
		} else if (!values.jellyfin.baseUrl) {
			settings.jellyfinApiKey = values.jellyfin.apiKey ?? null;
		}
		settings.jellyfinBaseUrl = values.jellyfin.baseUrl ?? null;

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

		settings.radarrBaseUrl = baseURL ?? null;
		settings.radarrApiKey = apiKey ?? null;

		await settings.save();
	}

	public static async setRadarrApiConfiguration(
		rootFolderPath: string | undefined,
		name = 'default'
	) {
		const settings = await this.findOne({ where: { name } });

		if (!settings) return;

		settings.radarrRootFolderPath = rootFolderPath ?? null;

		await settings.save();
	}

	public static async setSonarrApiEndpoint(
		baseURL: string | undefined,
		apiKey: string | undefined,
		name = 'default'
	) {
		const settings = await this.findOne({ where: { name } });

		if (!settings) return;

		settings.sonarrBaseUrl = baseURL ?? null;
		settings.sonarrApiKey = apiKey ?? null;

		await settings.save();
	}

	public static async setSonarrApiConfiguration(
		rootFolderPath: string | undefined,
		name = 'default'
	) {
		const settings = await this.findOne({ where: { name } });

		if (!settings) return;

		settings.sonarrRootFolderPath = rootFolderPath ?? null;

		await settings.save();
	}
}
