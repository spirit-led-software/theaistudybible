import { getDevotions } from '@revelationsai/client/services/devotion';
import { redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	const { devotions } = await getDevotions({
		limit: 1
	});
	redirect(307, `/devotions/${devotions[0].id}`);
};
