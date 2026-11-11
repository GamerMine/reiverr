// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

import type { GlobalSettings, UserSettings } from '@unifarr/db';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				userId: string | null;
				username: string;
				isAdmin: boolean;
				isOidc: boolean;
			};
			settings: {
				globalSettings: GlobalSettings;
				userSettings: UserSettings;
			};
			error: string | undefined;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
