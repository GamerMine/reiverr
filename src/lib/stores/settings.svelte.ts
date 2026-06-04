import { defaultGlobalSettings, defaultUserSettings, type Settings } from '@reiverr/db/types';

export const settings: Settings = $state({
	userSettings: defaultUserSettings,
	globalSettings: defaultGlobalSettings
});
