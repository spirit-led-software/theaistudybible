import { isAdmin } from '$lib/services/user';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(307, '/auth');
	}

	if (!isAdmin(locals.user)) {
		throw redirect(307, '/');
	}

	return {};
};
