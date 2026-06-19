import { GlobalSettingsEntity } from '@reiverr/db/entities';
import { RadarrConnector } from './connectors/radarrConnector.server';
import { SonarrConnector } from './connectors/sonarrConnector.server';
import { JellyfinConnector } from './connectors/jellyfinConnector.server';
import type { RadarrLanguageResource, RadarrQualityDefinitionResource } from './types/radarrTypes';
import type { SonarrLanguageResource, SonarrQualityDefinitionResource } from './types/sonarrTypes';

// TODO: Add a refresh method that will create/update the connectors.
class Connectors {
	private static _instance: Connectors;

	private _radarrConnector: RadarrConnector | undefined;
	private _radarrQualities: RadarrQualityDefinitionResource[] = [];
	private _radarrLanguages: RadarrLanguageResource[] = [];

	private _sonarrConnector: SonarrConnector | undefined;
	private _sonarrQualities: SonarrQualityDefinitionResource[] = [];
	private _sonarrLanguages: SonarrLanguageResource[] = [];

	private _jellyfinConnector: JellyfinConnector;

	public static async getInstance(): Promise<Connectors> {
		if (!Connectors._instance) {
			const baseSync = new Connectors();
			const radarrSync = await GlobalSettingsEntity.getRadarrApi();
			const sonarrSync = await GlobalSettingsEntity.getSonarrApi();
			const jellyfinSync = await GlobalSettingsEntity.getJellyfinApi();

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
			baseSync._jellyfinConnector = new JellyfinConnector(
				jellyfinSync.apiUrl,
				jellyfinSync.apiKey
			);

			if (await baseSync._radarrConnector?.isHealthy()) {
				baseSync._radarrQualities =
					(await baseSync._radarrConnector?.getQualityDefinitions())?.data ?? [];
				baseSync._radarrLanguages =
					(await baseSync._radarrConnector?.getLanguage())?.data ?? [];
			}

			if (await baseSync._sonarrConnector?.isHealthy()) {
				baseSync._sonarrQualities =
					(await baseSync._sonarrConnector?.getQualityDefinitions())?.data ?? [];
				baseSync._sonarrLanguages =
					(await baseSync._sonarrConnector?.getLanguage())?.data ?? [];
			}

			Connectors._instance = baseSync;
		}
		return Connectors._instance;
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

	public get jellyfinConnector() {
		return this._jellyfinConnector;
	}
}

export default Connectors;
export { RadarrConnector, SonarrConnector };
