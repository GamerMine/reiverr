import * as v from "valibot";

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
};

export type Settings = {
	userSettings: UserSettings;
	globalSettings: GlobalSettings;
};

export const FilteringProfileSchema = v.object({
	id: v.number(),
	name: v.string(),
	language: v.string(),
	qualities: v.array(v.string())
});

export type FilteringProfile = v.InferOutput<typeof FilteringProfileSchema>;

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
};
