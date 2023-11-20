import { getDataSources } from '$lib/services/data-source';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const limit = 7;
	const { dataSources } = await getDataSources({
		limit,
		session: locals.session!
	});
	return {
		dataSources,
		limit
	};
};
