import { PUBLIC_API_URL } from '$env/static/public';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	email: async ({ request, url, cookies }) => {
		const { searchParams } = new URL(url);
		const returnUrl = searchParams.get('returnUrl') || '/';
		cookies.set('rai-return-url', returnUrl, { path: '/' });

		const formData = await request.formData();
		const email = formData.get('email') as string;

		const response = await fetch(`${PUBLIC_API_URL}/auth/email/authorize?email=${email}`, {
			method: 'GET'
		});

		if (!response.ok) {
			const data = await response.json();
			return fail(500, {
				errors: { banner: data.error || 'Something went wrong. Please try again.' }
			});
		}

		return { success: true };
	},
	social: async ({ cookies, url, request }) => {
		const { searchParams } = new URL(url);
		const returnUrl = searchParams.get('returnUrl') || '/';
		cookies.set('rai-return-url', returnUrl, { path: '/' });

		const formData = await request.formData();
		const provider = formData.get('provider') as string;

		if (!provider) return fail(400, { errors: { banner: 'Provider is required.' } });

		throw redirect(302, `${PUBLIC_API_URL}/auth/${provider}/authorize`);
	}
};
