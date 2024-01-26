import { getChat, getChatMessages, getChats } from '@revelationsai/client/services/chat';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { session } }) => {
	if (params.id === 'new') {
		const chatsResponse = await getChats({
			session: session!,
			limit: 1,
			orderBy: 'updatedAt',
			order: 'desc'
		});
		redirect(307, `/chat/${chatsResponse.chats[0].id}`);
	}

	const [chat, messages] = await Promise.all([
		getChat(params.id, {
			session: session!
		}),
		getChatMessages(params.id, {
			session: session!
		}).then((response) => response.messages.reverse())
	]);

	return {
		chat,
		messages
	};
};
