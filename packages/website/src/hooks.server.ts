import { getUserInfo } from '$lib/services/user';
import { commonCookies } from '$lib/utils/cookies';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ resolve, event }) => {
	try {
		const session = event.cookies.get(commonCookies.session);
		if (!session) {
			console.error('No session found');
			event.locals.user = undefined;
			event.locals.session = undefined;
			return resolve(event);
		}

		event.locals.user = await getUserInfo(session);
		event.locals.session = session;
	} catch (error) {
		console.error('Error authorizing user:', error);
		// Unauthorized
		event.locals.user = undefined;
		event.locals.session = undefined;
	}

	return resolve(event);
};
