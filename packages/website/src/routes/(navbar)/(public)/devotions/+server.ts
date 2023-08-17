import { getDevotions } from '$lib/services/devotion';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request }) => {
	const { devotions } = await getDevotions({
		limit: 1
	});

	const headers = request.headers;
	headers.set('Location', `/devotions/${devotions[0].id}`);
	return new Response(null, {
		status: 302,
		headers
	});
};
