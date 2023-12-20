import { getAiResponseReactions } from '$lib/services/ai-response/reaction';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const limit = 10;
	const reactionInfos = await getAiResponseReactions({
		session: locals.session!
	});
	return {
		reactionInfos,
		limit
	};
};
