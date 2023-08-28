import { isAdmin } from '$lib/services/user';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { user, session }, url }) => {
	if (!isAdmin(user!)) {
		throw redirect(307, '/');
	}

	return {
		user,
		session
	};
};