import { devotionImages } from '@revelationsai/core/database/schema';
import { getDevotion } from '@revelationsai/server/services/devotion';
import { getDevotionImages } from '@revelationsai/server/services/devotion/image';
import { getDevotionReactionCounts } from '@revelationsai/server/services/devotion/reaction';
import { getDevotionSourceDocuments } from '@revelationsai/server/services/source-document';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [devotion, sourceDocs, images, reactionCounts] = await Promise.all([
		getDevotion(params.id),
		getDevotionSourceDocuments(params.id),
		getDevotionImages({
			where: eq(devotionImages.devotionId, params.id)
		}),
		getDevotionReactionCounts(params.id)
	]);

	if (!devotion) {
		throw redirect(302, '/devotions');
	}

	return {
		devotion,
		sourceDocs,
		images,
		reactionCounts
	};
};
