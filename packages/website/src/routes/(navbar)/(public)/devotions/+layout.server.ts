import { getDevotions } from '@revelationsai/server/services/devotion';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const devotions = await getDevotions({
		limit: 7
	});
	return {
		devotions
	};
};
