import * as v from 'valibot';

export type DbConfig = {
	DB_TYPE: string;
	DB_HOST: string;
	DB_PORT: number;
	DB_USERNAME: string;
	DB_PASSWORD: string;
	DB_DATABASE: string;
};

export type GlobalSettings = {
	initialised: boolean;
	general: {
		downloadLanguages: string[];
	};
	sonarr: {
		baseUrl: string | undefined;
		apiKey: string | undefined;
		rootFolderPath: string | undefined;
	};
	radarr: {
		baseUrl: string | undefined;
		apiKey: string | undefined;
		rootFolderPath: string | undefined;
	};
	jellyfin: {
		baseUrl: string;
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
	qualities: v.array(v.string()),
	isDefault: v.boolean()
});

export type FilteringProfile = v.InferOutput<typeof FilteringProfileSchema>;

export const defaultGlobalSettings: GlobalSettings = {
	initialised: false,

	general: {
		downloadLanguages: []
	},
	sonarr: {
		apiKey: undefined,
		baseUrl: undefined,
		rootFolderPath: undefined
	},
	radarr: {
		apiKey: undefined,
		baseUrl: undefined,
		rootFolderPath: undefined
	},
	jellyfin: {
		apiKey: undefined,
		baseUrl: ''
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
	}
};
