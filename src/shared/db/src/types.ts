import * as v from 'valibot';
import { InferOutput } from 'valibot';

export type DbConfig = {
	DB_TYPE: 'postgres' | 'aurora-postgres' | 'cockroachdb' | 'mariadb' | 'mysql' | 'aurora-mysql';
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
		userCanChooseProfile: boolean;
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
	filteringProfileId: number | undefined;
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
		downloadLanguages: [],
		userCanChooseProfile: false
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
	},
	filteringProfileId: undefined
};

export const MessageObjectSchema = v.object({
	id: v.string(),
	values: v.optional(v.record(v.string(), v.union([v.string(), v.number(), v.date()])))
});
export type MessageObject = InferOutput<typeof MessageObjectSchema>;

export enum TaskType {
	TEST = 'test',

	SYNC_CUSTOM_FORMATS = 'syncCustomFormats',
	SYNC_QUALITY_PROFILES = 'syncQualityProfiles',

	RADARR_MOVIE_ADD = 'radarrMovieAdd',
	RADARR_MOVIE_REMOVE = 'radarrMovieRemove',

	SONARR_SERIES_ADD = 'sonarrSeriesAdd',
	SONARR_SERIES_REMOVE = 'sonarrSeriesRemove'
}

export const TaskState = {
	QUEUED: 'queued',
	ERROR: 'error',
	CANCELED: 'canceled',
	COMPLETED: 'completed'
} as const;
export type TaskStateType = (typeof TaskState)[keyof typeof TaskState];

export type TaskStatus = {
	userId: string;
	type: TaskType;
	data?: unknown | undefined;
	state: TaskStateType;
	completionDate: Date;
};
