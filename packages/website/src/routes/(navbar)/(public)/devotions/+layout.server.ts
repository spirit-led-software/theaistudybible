import { getDevotions } from '@revelationsai/server/services/devotion';
import type { LayoutServerLoad } from './$types';
import { eq } from 'drizzle-orm';
import { devotions as devotionsTable } from '@revelationsai/core/database/schema';

export const load: LayoutServerLoad = async () => {
	const devotions = await getDevotions({
		limit: 7,
		where: eq(devotionsTable.failed, false)
	});
	return {
		devotions
	};
};
