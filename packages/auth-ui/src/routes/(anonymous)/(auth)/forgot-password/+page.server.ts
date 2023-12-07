import { PUBLIC_API_URL } from '$env/static/public';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

type ActionData = { banner?: string };

export const actions: Actions = {
	reset: async ({ request }) => {
		const formData = await request.formData();
		const token = formData.get('token') as string | null;
		const password = formData.get('password') as string | null;
		const confirmPassword = formData.get('confirmPassword') as string | null;

		if (!token) return fail(400, { errors: { banner: 'Token is required.' } as ActionData });
		if (!password)
			return fail(400, { errors: { banner: 'New password is required.' } as ActionData });
		if (!confirmPassword)
			return fail(400, { errors: { banner: 'Confirm new password is required.' } as ActionData });

		if (password !== confirmPassword) {
			return fail(400, {
				errors: { banner: 'Passwords do not match.' } as ActionData
			});
		}

		const response = await fetch(`${PUBLIC_API_URL}/auth/credentials/reset-password`, {
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

		throw redirect(307, `/sign-in?resetPassword=${encodeURIComponent('success')}`);
	},
	forgot: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string | null;

		if (!email) return fail(400, { errors: { banner: 'Email is required.' } as ActionData });

		const response = await fetch(
			`${PUBLIC_API_URL}/auth/credentials/forgot-password?email=${email}`,
			{
				method: 'GET'
			}
		);

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
