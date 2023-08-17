import { getDevotions } from '$lib/services/devotion';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params }) => {
	const devotionsData = await getDevotions({
		limit: 5
	});
	return {
		devotions: devotionsData.devotions,
		activeDevoId: params.id
	};
};
