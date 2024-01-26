import type { AiResponseReactionInfo } from '@revelationsai/core/model/ai-response/reaction';
import { getAiResponseReactionsWithInfo } from '@revelationsai/server/services/ai-response/reaction';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const limit = 10;
	const reactionInfos = await getAiResponseReactionsWithInfo({
		limit
	}).then((reactions) =>
		reactions.map(
			(reaction) =>
				({
					...reaction.ai_response_reactions,
					user: reaction.users,
					response: reaction.ai_responses
				}) satisfies AiResponseReactionInfo
		)
	);
	return {
		reactionInfos,
		limit
	};
};
