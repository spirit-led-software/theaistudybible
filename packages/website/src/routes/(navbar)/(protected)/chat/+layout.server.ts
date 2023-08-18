import { getChats } from '$lib/services/chat';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { chats } = await getChats({
		session: locals.session!,
		limit: 5
	});

	return {
		chats
	};
};
