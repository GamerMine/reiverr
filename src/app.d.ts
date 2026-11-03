// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				userId: string;
				username: string;
				isAdmin: boolean;
				isOidc: boolean;
			};
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
