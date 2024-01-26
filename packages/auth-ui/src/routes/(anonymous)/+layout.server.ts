import { PUBLIC_WEBSITE_URL } from '$env/static/public';
import { commonCookies } from '@revelationsai/client/utils/cookies';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { user }, url, cookies }) => {
	if (user) {
		redirect(303, url.searchParams.get('returnUrl') || PUBLIC_WEBSITE_URL);
	}

	const returnUrl = url.searchParams.get('returnUrl') || PUBLIC_WEBSITE_URL;
	cookies.set(commonCookies.returnUrl, returnUrl, {
		domain: new URL(PUBLIC_WEBSITE_URL).hostname,
		path: '/',
		maxAge: 60 * 30 // 30 minutes
	});
};
