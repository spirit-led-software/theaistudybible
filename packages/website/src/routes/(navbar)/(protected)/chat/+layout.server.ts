import { getChats } from '$lib/services/chat';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const { chats } = await getChats({
		limit: 5
	});

	return {
		chats
	};
};
