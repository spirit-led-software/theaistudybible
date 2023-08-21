import {
	getDevotion,
	getDevotionImages,
	getDevotionReactionCounts,
	getDevotionSourceDocuments
} from '$lib/services/devotion';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const devotion = await getDevotion(params.id);

	const sourceDocsPromise = getDevotionSourceDocuments(devotion.id);
	const imagesPromise = getDevotionImages(devotion.id);
	const reactionCountsPromise = getDevotionReactionCounts(devotion.id);

	const [sourceDocs, { images }, reactionCounts] = await Promise.all([
		sourceDocsPromise,
		imagesPromise,
		reactionCountsPromise
	]);

	return {
		devotion,
		sourceDocs,
		images,
		reactionCounts
	};
};
