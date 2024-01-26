import { getDevotion, getDevotionSourceDocuments } from '@revelationsai/client/services/devotion';
import { getDevotionImages } from '@revelationsai/client/services/devotion/image';
import { getDevotionReactionCounts } from '@revelationsai/client/services/devotion/reaction';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [devotion, sourceDocs, { images }, reactionCounts] = await Promise.all([
		getDevotion(params.id),
		getDevotionSourceDocuments(params.id),
		getDevotionImages(params.id),
		getDevotionReactionCounts(params.id)
	]);

	return {
		devotion,
		sourceDocs,
		images,
		reactionCounts
	};
};
