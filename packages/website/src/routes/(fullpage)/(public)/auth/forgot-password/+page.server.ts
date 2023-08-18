import { PUBLIC_API_URL } from '$env/static/public';
import { fail } from '@sveltejs/kit';
import isEmail from 'validator/lib/isEmail';
import isStrongPassword from 'validator/lib/isStrongPassword';
import type { Actions } from './$types';

type ActionData = { banner?: string; redirect?: string };

export const actions: Actions = {
	reset: async ({ request }) => {
		const formData = await request.formData();
		const token = formData.get('token') as string | null;
		const password = formData.get('password') as string | null;
		const confirmPassword = formData.get('confirmPassword') as string | null;

		if (!token) return fail(400, { errors: { banner: 'Token is required.' } as ActionData });
		if (!password) return fail(400, { errors: { banner: 'Password is required.' } as ActionData });
		if (!confirmPassword)
			return fail(400, { errors: { banner: 'Confirm password is required.' } as ActionData });

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
				} as ActionData
			});
		}

		if (password !== confirmPassword) {
			return fail(400, {
				errors: { banner: 'Passwords do not match.' } as ActionData
			});
		}

		const response = await fetch(`${PUBLIC_API_URL}/auth/email/reset-password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token, password })
		});

		if (!response.ok) {
			const data = await response.json();
			return fail(500, {
				errors: { banner: data.error || 'Something went wrong. Please try again.' } as ActionData
			});
		}

		return {
			success: {
				banner: 'Password reset successfully.',
				redirect: `/auth/login?${encodeURIComponent('reset-password=success')}`
			} as ActionData
		};
	},
	forgot: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string | null;

		if (!email) return fail(400, { errors: { banner: 'Email is required.' } as ActionData });

		if (!isEmail(email))
			return fail(400, { errors: { banner: 'Email is invalid.' } as ActionData });

		const response = await fetch(`${PUBLIC_API_URL}/auth/email/forgot-password?email=${email}`, {
			method: 'GET'
		});

		if (!response.ok) {
			const data = await response.json();
			return fail(500, {
				errors: { banner: data.error || 'Something went wrong. Please try again.' } as ActionData
			});
		}

		return {
			success: {
				banner: 'Password reset email sent.'
			} as ActionData
		};
	}
};
