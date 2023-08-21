// See https://kit.svelte.dev/docs/types#app

import type { UserWithRoles } from '@core/model';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session?: string;
			user?: UserWithRoles;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
