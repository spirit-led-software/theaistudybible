import { getDevotionReactions } from '$lib/services/admin/reactions/devotion';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const limit = 10;
	const reactionInfos = await getDevotionReactions({
		session: locals.session!
	});
	return {
		reactionInfos,
		limit
	};
};
