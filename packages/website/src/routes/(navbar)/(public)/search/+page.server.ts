import { PUBLIC_API_URL } from '$env/static/public';
import type { NeonVectorStoreDocument } from '@revelationsai/core/langchain/vectorstores/neon';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

type ActionData = {
	banner: string;
	results: (Omit<NeonVectorStoreDocument, 'embedding'> & { score: number })[];
};

export const actions: Actions = {
	search: async ({ request }) => {
		const formData = await request.formData();
		const query = formData.get('query') as string;

		if (!query) {
			return fail(400, {
				errors: {
					banner: 'Please enter a search query'
				} as ActionData
			});
		}

		const response = await fetch(`${PUBLIC_API_URL}/vector-search`, {
			method: 'POST',
			body: JSON.stringify({ query }),
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			const data = await response.json();
			return fail(response.status, {
				errors: {
					banner: data.error || 'Something went wrong. Try again'
				} as ActionData
			});
		}

		const { entities } = await response.json();

		return {
			success: {
				banner: 'Search results below',
				results: entities
			} as ActionData
		};
	}
};
