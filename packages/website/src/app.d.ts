// See https://kit.svelte.dev/docs/types#app

import type { UserWithRoles } from '@core/model';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: UserWithRoles | undefined;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
