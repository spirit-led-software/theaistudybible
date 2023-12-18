import { PUBLIC_API_URL, PUBLIC_WEBSITE_URL } from '$env/static/public';
import { commonCookies } from '$lib/utils/cookies';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

type ActionData = { banner?: string };

export const actions: Actions = {
	credentials: async ({ request, url, cookies }) => {
		const returnUrl = url.searchParams.get('returnUrl') || PUBLIC_WEBSITE_URL;
		cookies.set(commonCookies.returnUrl, returnUrl, {
			domain: new URL(PUBLIC_WEBSITE_URL).hostname,
			path: '/',
			maxAge: 60 * 30 // 30 minutes
		});

		const formData = await request.formData();
		const email = formData.get('email') as string | null;
		const password = formData.get('password') as string | null;
		const isMobile = formData.get('mobile') === 'true';

		if (!email) return fail(400, { errors: { banner: 'Email is required.' } as ActionData });
		if (!password) return fail(400, { errors: { banner: 'Password is required.' } as ActionData });

		const authPath = isMobile ? 'auth/credentials-mobile/login' : 'auth/credentials/login';
		const response = await fetch(`${PUBLIC_API_URL}/${authPath}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password }),
			redirect: 'manual'
		});

		if (response.status >= 400) {
			console.log(
				'Failed to login',
				response.status,
				response.statusText,
				response.headers,
				response.body
			);
			const data = await response.json();
			return fail(500, {
				errors: { banner: data.error || 'Something went wrong. Please try again.' } as ActionData
			});
		}

		console.log('Login success', response.status, response.statusText, response.headers);

		return {
			success: {
				redirect: response.headers.get('location')!
			}
		};
	},
	social: async ({ cookies, url, request }) => {
		const returnUrl = url.searchParams.get('returnUrl') || PUBLIC_WEBSITE_URL;
		cookies.set(commonCookies.returnUrl, returnUrl, {
			domain: new URL(PUBLIC_WEBSITE_URL).hostname,
			path: '/',
			maxAge: 60 * 30 // 30 minutes
		});

		const formData = await request.formData();
		const provider = formData.get('provider') as string;
		const isMobile = formData.get('mobile') === 'true';

		if (!provider) return fail(400, { errors: { banner: 'Provider is required.' } as ActionData });

		const authPath = isMobile ? `auth/${provider}-mobile/authorize` : `auth/${provider}/authorize`;
		redirect(302, `${PUBLIC_API_URL}/${authPath}`);
	}
};
