import { getDataSources } from '$lib/services/data-source';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { dataSources } = await getDataSources({
		limit: 20,
		session: locals.session!
	});
	return {
		dataSources
	};
};
