// See https://kit.svelte.dev/docs/types#app

import type { UserInfo } from '@revelationsai/core/model';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session?: string;
			user?: UserInfo;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
