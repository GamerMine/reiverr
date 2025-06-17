import { defaultGlobalSettings, defaultUserSettings, type Settings } from '$lib/entities/Types';

export let settings: Settings = $state({
	userSettings: defaultUserSettings,
	globalSettings: defaultGlobalSettings
});
