import { searchForAiResponses } from '$lib/services/ai-response';
import { getChat, getChats } from '$lib/services/chat';
import { searchForUserMessages } from '$lib/services/user/message';
import { aiResponses, userMessages } from '@core/schema';
import { getPropertyName } from '@core/util/object';
import { redirect } from '@sveltejs/kit';
import { nanoid, type Message } from 'ai';
import type { PageServerLoad } from './$types';

async function getMessages(chatId: string, userId: string, session: string) {
	const { userMessages: foundUserMessages } = await searchForUserMessages({
		session,
		query: {
			AND: [
				{
					eq: {
						column: getPropertyName(userMessages, (userMessages) => userMessages.chatId),
						value: chatId
					}
				},
				{
					eq: {
						column: getPropertyName(userMessages, (userMessages) => userMessages.userId),
						value: userId
					}
				}
			]
		}
	});

	const messages: Message[] = (
		await Promise.all(
			foundUserMessages.map(async (userMessage) => {
				const message: Message = {
					id: userMessage.aiId || userMessage.id,
					content: userMessage.text,
					role: 'user',
					createdAt: userMessage.createdAt
				};

				const { aiResponses: foundAiResponses } = await searchForAiResponses({
					session,
					query: {
						eq: {
							column: getPropertyName(aiResponses, (aiResponses) => aiResponses.userMessageId),
							value: userMessage.id
						}
					}
				});

				const responses: Message[] = foundAiResponses
					.filter((aiResponse) => !aiResponse.failed && !aiResponse.regenerated)
					.map((aiResponse) => ({
						id: aiResponse.aiId || aiResponse.id,
						content: aiResponse.text || 'Failed Response',
						role: 'assistant',
						createdAt: aiResponse.createdAt
					}));
				return [
					responses[0] ?? {
						id: nanoid(),
						content: 'Failed Response',
						role: 'assistant',
						createdAt: message.createdAt
					},
					message
				];
			})
		)
	)
		.flat()
		.reverse();

	return messages;
}

export const load: PageServerLoad = async ({ params, locals: { user, session } }) => {
	if (params.id === 'new') {
		const chatsResponse = await getChats({
			session: session!,
			limit: 1
		});
		redirect(307, `/chat/${chatsResponse.chats[0].id}`);
	}

	const [chat, messages] = await Promise.all([
		getChat(params.id, {
			session: session!
		}),
		getMessages(params.id, user!.id, session!)
	]);

	return {
		chat,
		messages
	};
};
