import { getLanguageModels } from '@revelationsai/client/services/llm';
import { chats as chatsTable } from '@revelationsai/core/database/schema';
import { getChats } from '@revelationsai/server/services/chat';
import { desc, eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { user } }) => {
	const [chats, modelInfos] = await Promise.all([
		getChats({
			where: eq(chatsTable.userId, user!.id),
			limit: 7,
			orderBy: desc(chatsTable.updatedAt)
		}),
		getLanguageModels()
	]);

	return {
		chats,
		modelInfos
	};
};
