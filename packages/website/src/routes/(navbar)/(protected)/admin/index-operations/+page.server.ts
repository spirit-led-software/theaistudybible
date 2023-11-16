import { getIndexOperations } from '$lib/services/data-source/index-op';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { indexOperations } = await getIndexOperations({
		limit: 100,
		session: locals.session!
	});
	return {
		indexOperations
	};
};
