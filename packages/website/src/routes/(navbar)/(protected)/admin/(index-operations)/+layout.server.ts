import { getIndexOperations } from '$lib/services/index-op';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { indexOperations } = await getIndexOperations({
		limit: 100,
		session: locals.session!
	});
	return {
		indexOperations
	};
};
