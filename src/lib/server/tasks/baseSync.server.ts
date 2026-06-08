import type { components as RadarrComponents } from '$lib/apis/radarr/radarr.generated';
import type { components as SonarrComponents } from '$lib/apis/sonarr/sonarr.generated';
import { RadarrConnector } from '$lib/server/connectors/radarrConnector.server';
import { SonarrConnector } from '$lib/server/connectors/sonarrConnector.server';
import { GlobalSettingsEntity } from '@reiverr/db/entities';

export type RadarrQualityDefinitionResource =
	RadarrComponents['schemas']['QualityDefinitionResource'];
export type RadarrLanguageResource = RadarrComponents['schemas']['LanguageResource'];

export type SonarrQualityDefinitionResource =
	SonarrComponents['schemas']['QualityDefinitionResource'];
export type SonarrLanguageResource = SonarrComponents['schemas']['LanguageResource'];

export class BaseSync {
	private static _instance: BaseSync;

	private _radarrConnector: RadarrConnector | undefined;
	private _radarrQualities: RadarrQualityDefinitionResource[] = [];
	private _radarrLanguages: RadarrLanguageResource[] = [];

	private _sonarrConnector: SonarrConnector | undefined;
	private _sonarrQualities: SonarrQualityDefinitionResource[] = [];
	private _sonarrLanguages: SonarrLanguageResource[] = [];

	public static async getInstance(): Promise<BaseSync> {
		if (!BaseSync._instance) {
			const baseSync = new BaseSync();
			const radarrSync = await GlobalSettingsEntity.getRadarrApi();
			const sonarrSync = await GlobalSettingsEntity.getSonarrApi();

			if (radarrSync && radarrSync.apiUrl && radarrSync.apiKey) {
				baseSync._radarrConnector = new RadarrConnector(
					radarrSync.apiUrl,
					radarrSync.apiKey
				);
			}
			if (sonarrSync && sonarrSync.apiUrl && sonarrSync.apiKey) {
				baseSync._sonarrConnector = new SonarrConnector(
					sonarrSync.apiUrl,
					sonarrSync.apiKey
				);
			}

			if (await baseSync.radarrConnector?.isHealthy()) {
				baseSync._radarrQualities =
					(await baseSync.radarrConnector?.getQualityDefinitions())?.data ?? [];
				baseSync._radarrLanguages =
					(await baseSync.radarrConnector?.getLanguage())?.data ?? [];
			}

			if (await baseSync._sonarrConnector?.isHealthy()) {
				baseSync._sonarrQualities =
					(await baseSync._sonarrConnector?.getQualityDefinitions())?.data ?? [];
				baseSync._sonarrLanguages =
					(await baseSync._sonarrConnector?.getLanguage())?.data ?? [];
			}

			BaseSync._instance = baseSync;
		}
		return BaseSync._instance;
	}

	public get radarrConnector() {
		return this._radarrConnector;
	}

	public get radarrQualities() {
		return this._radarrQualities;
	}

	public get radarrLanguages() {
		return this._radarrLanguages;
	}

	public get sonarrConnector() {
		return this._sonarrConnector;
	}

	public get sonarrQualities() {
		return this._sonarrQualities;
	}

	public get sonarrLanguages() {
		return this._sonarrLanguages;
	}
}
