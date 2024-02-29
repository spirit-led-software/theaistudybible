import { getLanguageModels } from '@revelationsai/client/services/llm';
import { getChat } from '@revelationsai/server/services/chat/';
import { getChatMessages } from '@revelationsai/server/services/chat/message';
import { getUserOrThrow } from '@revelationsai/server/services/user';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [chat, chatMessages, modelInfos] = await Promise.all([
		getChat(params.id),
		getChatMessages(params.id),
		getLanguageModels()
	]);
	if (!chat) {
		return redirect(302, '/admin');
	}

	const user = await getUserOrThrow(chat.userId);

	return {
		modelInfos,
		chatUser: user,
		chat,
		chatMessages: chatMessages.reverse()
	};
};
