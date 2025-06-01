import { get, writable } from 'svelte/store';
import { getSonarrHealth } from '$lib/apis/sonarr/sonarrApi';
import { createErrorNotification } from '$lib/stores/notification.store';
import { getRadarrHealth } from '$lib/apis/radarr/radarrApi';
import { jellyfinTestConnection } from '$lib/apis/jellyfin/jellyfinApi';
import axios from 'axios';

export interface SettingsValues {
	initialised: boolean;
	autoplayTrailers: boolean;
	language: string;
	animationDuration: number;
	discover: {
		region: string;
		excludeLibraryItems: boolean;
		includedLanguages: string;
	};
	sonarr: {
		baseUrl: string | null;
		apiKey: string | null;
		rootFolderPath: string;
		qualityProfileId: number;
		languageProfileId: number;
		monitor: number;
		StartSearch: boolean;
	};
	radarr: {
		baseUrl: string | null;
		apiKey: string | null;
		rootFolderPath: string;
		qualityProfileId: number;
		monitor: number;
		startSearch: boolean;
	};
	jellyfin: {
		baseUrl: string | null;
		apiKey: string | null;
	};
}

export const defaultSettings: SettingsValues = {
	initialised: false,

	autoplayTrailers: true,
	language: 'en',
	animationDuration: 150,
	discover: {
		region: '',
		excludeLibraryItems: true,
		includedLanguages: 'en'
	},
	sonarr: {
		apiKey: null,
		baseUrl: null,
		monitor: 0,
		StartSearch: true,
		qualityProfileId: 0,
		rootFolderPath: '',
		languageProfileId: 0
	},
	radarr: {
		apiKey: null,
		baseUrl: null,
		qualityProfileId: 0,
		rootFolderPath: '',
		monitor: 1,
		startSearch: true
	},
	jellyfin: {
		apiKey: null,
		baseUrl: null
	}
};

function useSettings() {
	const settings = writable<SettingsValues>(defaultSettings);

	async function save() {
		const values = get(settings);
		if (
			values.sonarr.apiKey &&
			values.sonarr.baseUrl &&
			!(await getSonarrHealth(values.sonarr.baseUrl, values.sonarr.apiKey))
		) {
			createErrorNotification(
				'Invalid Configuration',
				'Could not connect to Sonarr. Check Sonarr credentials.'
			);
			return;
		}

		if (
			values.radarr.apiKey &&
			values.radarr.baseUrl &&
			!(await getRadarrHealth(values.radarr.baseUrl, values.radarr.apiKey))
		) {
			createErrorNotification(
				'Invalid Configuration',
				'Could not connect to Radarr. Check Radarr credentials.'
			);
			return;
		}

		if (values.jellyfin.apiKey && values.jellyfin.baseUrl) {
			if (!(await jellyfinTestConnection(values.jellyfin.baseUrl, values.jellyfin.apiKey))) {
				createErrorNotification(
					'Invalid Configuration',
					'Could not connect to Jellyfin. Check Jellyfin credentials.'
				);
				return;
			}
		}

		return axios.post('/api/settings', values).then(() => {
			settings.set(values);
		});
	}

	return {
		subscribe: settings.subscribe,
		set: settings.set,
		save
	};
}

export const settings = useSettings();
