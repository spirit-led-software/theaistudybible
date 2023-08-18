import { PUBLIC_API_URL } from '$env/static/public';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	email: async ({ request, url, cookies }) => {
		const { searchParams } = new URL(url);
		const returnUrl = searchParams.get('returnUrl') || '/';
		cookies.set('rai-return-url', returnUrl, { path: '/' });

		const formData = await request.formData();
		const email = formData.get('email') as string | null;
		const password = formData.get('password') as string | null;

		if (!email) return fail(400, { errors: { banner: 'Email is required.' } });
		if (!password) return fail(400, { errors: { banner: 'Password is required.' } });

		const response = await fetch(`${PUBLIC_API_URL}/auth/email/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
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
