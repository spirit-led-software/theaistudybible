import { PUBLIC_AUTH_URL } from '$env/static/public';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(307, `${PUBLIC_AUTH_URL}/sign-in?returnUrl=${encodeURIComponent(url.toString())}`);
	}

	return {
		user: locals.user!,
		session: locals.session!
	};
};
