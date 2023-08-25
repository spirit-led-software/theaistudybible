import { searchForAiResponses } from '$lib/services/ai-response';
import { getChat } from '$lib/services/chat';
import { searchForUserMessages } from '$lib/services/user';
import { aiResponses, userMessages } from '@core/schema';
import { getPropertyName } from '@core/util/object';
import type { Message } from 'ai';
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
					id: userMessage.aiId!,
					content: userMessage.text,
					role: 'user'
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
						id: aiResponse.aiId!,
						content: aiResponse.text!,
						role: 'assistant'
					}));
				return [responses[0], message];
			})
		)
	)
		.flat()
		.reverse();

	return messages;
}

export const load: PageServerLoad = async ({ params, locals: { user, session } }) => {
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
