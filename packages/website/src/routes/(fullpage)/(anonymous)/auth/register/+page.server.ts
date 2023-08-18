import { PUBLIC_API_URL } from '$env/static/public';
import { commonCookies } from '$lib/utils/cookies';
import { fail, redirect } from '@sveltejs/kit';
import isEmail from 'validator/lib/isEmail';
import isStrongPassword from 'validator/lib/isStrongPassword';
import type { Actions } from './$types';

export const actions: Actions = {
	email: async ({ request, url, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string | null;
		const password = formData.get('password') as string | null;
		const confirmPassword = formData.get('confirmPassword') as string | null;

		if (!email) return fail(400, { errors: { banner: 'Email is required.' } });
		if (!password) return fail(400, { errors: { banner: 'Password is required.' } });
		if (!confirmPassword) return fail(400, { errors: { banner: 'Confirm password is required.' } });

		if (!isEmail(email)) return fail(400, { errors: { banner: 'Email is invalid.' } });

		if (
			!isStrongPassword(password, {
				minLength: 8,
				minNumbers: 1,
				minSymbols: 1,
				minUppercase: 1
			})
		) {
			return fail(400, {
				errors: {
					banner:
						'Password must be at least 8 characters long and contain at least 1 number, 1 symbol, and 1 uppercase letter.'
				}
			});
		}

		if (password !== confirmPassword) {
			return fail(400, { errors: { banner: 'Passwords do not match.' } });
		}

		const response = await fetch(`${PUBLIC_API_URL}/auth/email/register`, {
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

		const { session }: { session: string | undefined } = await response.json();
		if (!session) {
			return fail(500, {
				errors: { banner: 'Something went wrong. Please try again.' }
			});
		}

		cookies.set(commonCookies.session, session, {
			path: '/',
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});

		const returnUrl = url.searchParams.get('returnUrl') || '/';
		throw redirect(307, returnUrl);
	},
	social: async ({ cookies, url, request }) => {
		const returnUrl = url.searchParams.get('returnUrl') || '/';
		cookies.set(commonCookies.returnUrl, returnUrl, {
			path: '/',
			maxAge: 60 * 30 // 30 minutes
		});

		const formData = await request.formData();
		const provider = formData.get('provider') as string;

		if (!provider) return fail(400, { errors: { banner: 'Provider is required.' } });

		throw redirect(302, `${PUBLIC_API_URL}/auth/${provider}/authorize`);
	}
};
