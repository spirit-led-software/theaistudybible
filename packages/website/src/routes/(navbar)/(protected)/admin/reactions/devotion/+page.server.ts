import type { DevotionReactionInfo } from '@revelationsai/core/model/devotion/reaction';
import { getDevotionReactionsWithInfo } from '@revelationsai/server/services/devotion/reaction';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const limit = 10;
	const reactionInfos = await getDevotionReactionsWithInfo({
		limit
	}).then((reactions) =>
		reactions.map(
			(reaction) =>
				({
					...reaction.devotion_reactions,
					user: reaction.users,
					devotion: reaction.devotions
				}) satisfies DevotionReactionInfo
		)
	);
	return {
		reactionInfos,
		limit
	};
};
