import { PUBLIC_AUTH_URL } from '$env/static/public';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { user, session }, url }) => {
	if (!user) {
		throw redirect(307, `${PUBLIC_AUTH_URL}/sign-in?returnUrl=${encodeURIComponent(url.pathname)}`);
	}

	return {
		user,
		session
	};
};
