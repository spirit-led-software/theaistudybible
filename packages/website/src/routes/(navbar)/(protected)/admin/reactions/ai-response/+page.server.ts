import { getAiResponseReactionsWithInfo } from '@revelationsai/server/services/ai-response/reaction';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const limit = 10;
	const reactionInfos = await getAiResponseReactionsWithInfo({
		limit
	});
	return {
		reactionInfos,
		limit
	};
};
