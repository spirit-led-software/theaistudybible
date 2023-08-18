import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { user, session } }) => {
	if (!user) {
		throw redirect(307, '/auth/login');
	}

	return {
		user,
		session
	};
};
