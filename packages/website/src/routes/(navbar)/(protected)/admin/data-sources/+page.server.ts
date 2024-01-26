import { getDataSources } from '@revelationsai/client/services/data-source';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const limit = 7;
	const { dataSources } = await getDataSources({
		limit
	});
	return {
		dataSources,
		limit
	};
};
