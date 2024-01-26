import { PUBLIC_API_URL } from '$env/static/public';
import apiConfig from '@revelationsai/client/configs/api';
import { commonCookies } from '@revelationsai/client/utils/cookies';
import { validNonApiHandlerSession } from '@revelationsai/server/services/session';
import type { Handle, HandleServerError } from '@sveltejs/kit';

apiConfig.url = PUBLIC_API_URL;

export const handle: Handle = async ({ resolve, event }) => {
	try {
		const session = event.cookies.get(commonCookies.session);
		if (!session) {
			console.debug('No session found');
			event.locals.user = undefined;
			event.locals.session = undefined;
			return resolve(event);
		}

		event.locals.user = await validNonApiHandlerSession(session);
		event.locals.session = session;
	} catch (error) {
		console.debug('Error authorizing user:', error);
		// Unauthorized
		event.locals.user = undefined;
		event.locals.session = undefined;
	}

	return resolve(event);
};

export const handleError: HandleServerError = async ({ error, message }) => {
	console.debug(`Error: ${message}`, error);

	return {
		message: 'Oops! Something went wrong.'
	};
};
