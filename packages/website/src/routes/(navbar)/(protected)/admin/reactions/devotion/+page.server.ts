import { getDevotionReactionsWithInfo } from '@revelationsai/server/services/devotion/reaction';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const limit = 10;
	const reactionInfos = await getDevotionReactionsWithInfo({
		limit
	});
	return {
		reactionInfos,
		limit
	};
};
