import { getUserInfo } from '$lib/services/user';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ resolve, event }) => {
	try {
		const user = await getUserInfo();
		event.locals.user = user;
	} catch (error) {
		console.error(error);
		event.locals.user = undefined;
	}

	return resolve(event);
};
