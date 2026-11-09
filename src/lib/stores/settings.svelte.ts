import { type Settings } from '@reiverr/db/types';
import { getUserSettings } from '#lib/remote/settings.remote.ts';

export const settings: Settings = $state(getUserSettings().current?.data);
