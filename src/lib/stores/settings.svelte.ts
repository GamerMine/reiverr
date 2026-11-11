import { type Settings } from '@reiverr/db/types';
import { defaultGlobalSettings, defaultUserSettings } from '../../shared/db/src/types';

export const settings: Settings = $state({
	globalSettings: defaultGlobalSettings,
	userSettings: defaultUserSettings
});
