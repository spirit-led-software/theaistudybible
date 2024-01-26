import { getDevotions } from '@revelationsai/client/services/devotion';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const devotionsData = await getDevotions({
		limit: 7
	});
	return {
		devotions: devotionsData.devotions
	};
};
