import { getUserInfo } from '@revelationsai/client/services/user';
import { commonCookies } from '@revelationsai/client/utils/cookies';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ resolve, event }) => {
	try {
		const session = event.cookies.get(commonCookies.session);
		if (!session) {
			console.debug('No session found');
			event.locals.user = undefined;
			event.locals.session = undefined;
			return resolve(event);
		}

		event.locals.user = await getUserInfo(session);
		event.locals.session = session;
	} catch (error) {
		console.debug('Error authorizing user:', error);
		// Unauthorized
		event.locals.user = undefined;
		event.locals.session = undefined;
	}

	return resolve(event);
};
