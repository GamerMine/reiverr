export type GlobalSettings = {
	initialised: boolean;
	sonarr: {
		baseUrl: string | undefined;
		apiKey: string | undefined;
		rootFolderPath: string | undefined;
		monitor: string | undefined;
		startSearch: boolean;
	};
	radarr: {
		baseUrl: string | undefined;
		apiKey: string | undefined;
		rootFolderPath: string | undefined;
		monitor: string | undefined;
		startSearch: boolean;
	};
	jellyfin: {
		baseUrl: string | undefined;
		apiKey: string | undefined;
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
		defaultQualityProfileId: string;
		askQualityProfile: boolean;
	};
	sonarr: {
		defaultQualityProfileId: string;
		askQualityProfile: boolean;
	};
};

export type Settings = {
	userSettings: UserSettings;
	globalSettings: GlobalSettings;
};

export const defaultGlobalSettings: GlobalSettings = {
	initialised: false,

	sonarr: {
		apiKey: undefined,
		baseUrl: undefined,
		rootFolderPath: undefined,
		monitor: 'unknown',
		startSearch: true
	},
	radarr: {
		apiKey: undefined,
		baseUrl: undefined,
		rootFolderPath: undefined,
		monitor: 'unknown',
		startSearch: true
	},
	jellyfin: {
		apiKey: undefined,
		baseUrl: undefined
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
		defaultQualityProfileId: '',
		askQualityProfile: false
	},
	sonarr: {
		defaultQualityProfileId: '',
		askQualityProfile: false,
	}
};
