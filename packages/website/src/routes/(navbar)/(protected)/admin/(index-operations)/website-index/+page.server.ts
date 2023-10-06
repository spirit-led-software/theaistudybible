import { PUBLIC_API_URL } from '$env/static/public';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

type ActionData = { banner?: string };

export const actions: Actions = {
	default: async ({ request, locals }) => {
		try {
			const formData = await request.formData();
			const name = formData.get('name') as string;
			const url = formData.get('url') as string;
			const pathRegex = formData.get('pathRegex') as string;

			if (!name || !url) {
				return fail(400, {
					error: {
						banner: 'Missing required fields'
					} as ActionData
				});
			}

			const response = await fetch(`${PUBLIC_API_URL}/scraper/website`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${locals.session}`
				},
				body: JSON.stringify({ name, url, pathRegex })
			});

			if (!response.ok) {
				const data = await response.json();
				if (data.error) {
					return fail(500, {
						error: {
							banner: data.error || 'Error starting website index'
						} as ActionData
					});
				}
			}

			return {
				success: {
					banner: 'Website index started'
				} as ActionData
			};
		} catch (error) {
			return fail(500, {
				error: {
					banner: `Error: ${error}`
				} as ActionData
			});
		}
	}
};
