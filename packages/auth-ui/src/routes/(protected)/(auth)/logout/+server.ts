import { PUBLIC_WEBSITE_URL } from '$env/static/public';
import { commonCookies } from '$lib/utils/cookies';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	cookies.delete(commonCookies.session, {
		path: '/'
	});
	throw redirect(307, PUBLIC_WEBSITE_URL);
};
