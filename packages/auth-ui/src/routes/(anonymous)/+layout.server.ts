import { PUBLIC_WEBSITE_URL } from '$env/static/public';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { user }, url }) => {
	if (user) {
		throw redirect(303, url.searchParams.get('returnUrl') || PUBLIC_WEBSITE_URL);
	}
};
