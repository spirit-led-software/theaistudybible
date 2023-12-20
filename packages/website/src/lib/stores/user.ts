import type { UserInfo } from '@core/model/user';
import { writable } from 'svelte/store';

export const user = writable<UserInfo | undefined>(undefined);

export const session = writable<string | undefined>(undefined);
