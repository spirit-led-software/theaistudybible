import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, request }) => {
	if (locals.user) {
		throw redirect(303, new URL(request.url).searchParams.get('returnUrl') || '/');
	}
	return {};
};
