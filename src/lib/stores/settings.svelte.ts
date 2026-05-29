import { defaultGlobalSettings, defaultUserSettings, type Settings } from '$lib/entities/Types';

export const settings: Settings = $state({
	userSettings: defaultUserSettings,
	globalSettings: defaultGlobalSettings
});
