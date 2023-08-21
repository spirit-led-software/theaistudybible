import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { user, session }, url }) => {
	if (!user) {
		throw redirect(307, `/auth/login?returnUrl=${encodeURIComponent(url.pathname)}`);
	}

	return {
		user,
		session
	};
};
