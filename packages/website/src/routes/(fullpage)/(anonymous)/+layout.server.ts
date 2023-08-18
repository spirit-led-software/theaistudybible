import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { user }, url }) => {
	if (user) {
		throw redirect(303, url.searchParams.get('returnUrl') || '/');
	}
};
