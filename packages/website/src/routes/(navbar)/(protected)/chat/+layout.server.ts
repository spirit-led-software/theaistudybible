import { getChats } from '$lib/services/chat';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { session } }) => {
	const { chats } = await getChats({
		session: session!,
		limit: 7,
		orderBy: 'updatedAt',
		order: 'desc'
	});

	return {
		chats
	};
};
