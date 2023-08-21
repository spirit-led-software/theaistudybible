import { PUBLIC_API_URL } from '$env/static/public';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

type ActionData = { banner?: string };

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const url = formData.get('url') as string;

		if (!name || !url) {
			return fail(400, {
				error: {
					banner: 'Missing required fields'
				} as ActionData
			});
		}

		const response = await fetch(`${PUBLIC_API_URL}/scraper/webpage`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${locals.session}`
			},
			body: JSON.stringify({ name, url })
		});
		const data = await response.json();
		if (data.error) {
			return fail(500, {
				error: {
					banner: data.error || 'Error indexing webpage'
				} as ActionData
			});
		}

		return {
			success: {
				banner: 'Index webpage was successful'
			} as ActionData
		};
	}
};
