import { chats as chatsTable } from '@revelationsai/core/database/schema';
import { getChats } from '@revelationsai/server/services/chat';
import { desc, eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { user } }) => {
	const chats = await getChats({
		where: eq(chatsTable.userId, user!.id),
		limit: 7,
		orderBy: desc(chatsTable.updatedAt)
	});

	return {
		chats
	};
};
