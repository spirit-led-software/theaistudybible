import {
	getDevotion,
	getDevotionImages,
	getDevotionReactionCounts,
	getDevotionSourceDocuments
} from '$lib/services/devotion';
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
