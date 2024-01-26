import { getIndexOperations } from '@revelationsai/client/services/admin/data-source/index-op';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const limit = 50;
	const { indexOperations } = await getIndexOperations({
		limit,
		session: locals.session!
	});
	return {
		indexOperations,
		limit
	};
};
