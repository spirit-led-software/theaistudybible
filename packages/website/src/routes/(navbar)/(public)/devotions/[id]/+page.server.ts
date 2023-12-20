import { getDevotion, getDevotionSourceDocuments } from '$lib/services/devotion';
import { getDevotionImages } from '$lib/services/devotion/image';
import { getDevotionReactionCounts } from '$lib/services/devotion/reaction';
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
