export type GlobalSettings = {
	initialised: boolean;
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
		rootFolderPath: string | null;
		monitor: string | null;
		startSearch: boolean;
	};
	jellyfin: {
		baseUrl: string | null;
		apiKey: string | null;
	};
};

export type UserSettings = {
	interface: {
		autoplayTrailers: boolean;
		language: string;
		animationDuration: number;
	};
	discover: {
		region: string;
		excludeLibraryItems: boolean;
		includedLanguages: string;
	};
	radarr: {
		defaultQualityProfileId: number | null;
	};
};

export type Settings = {
	userSettings: UserSettings;
	globalSettings: GlobalSettings;
};

export const defaultGlobalSettings: GlobalSettings = {
	initialised: false,

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
		rootFolderPath: null,
		monitor: null,
		startSearch: true
	},
	jellyfin: {
		apiKey: null,
		baseUrl: null
	}
};

export const defaultUserSettings: UserSettings = {
	interface: {
		autoplayTrailers: true,
		language: 'en',
		animationDuration: 150
	},
	discover: {
		region: '',
		excludeLibraryItems: false,
		includedLanguages: 'en'
	},
	radarr: {
		defaultQualityProfileId: null
	}
};
