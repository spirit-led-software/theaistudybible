import { commonCookies } from '$lib/utils/cookies';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const { searchParams } = url;
	const token = searchParams.get('token');
	if (!token) {
		throw redirect(307, '/auth/login');
	}
	cookies.set(commonCookies.session, token, {
		path: '/',
		maxAge: 60 * 60 * 24 * 30 // 30 days
	});
	throw redirect(307, cookies.get(commonCookies.returnUrl) || '/');
};
