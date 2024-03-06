import { chats as chatsTable } from '@revelationsai/core/database/schema';
import { getChat, getChats } from '@revelationsai/server/services/chat';
import { getChatMessages } from '@revelationsai/server/services/chat/message';
import { redirect } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { user } }) => {
  if (params.id === 'new') {
    const chats = await getChats({
      where: eq(chatsTable.userId, user!.id),
      limit: 1,
      orderBy: desc(chatsTable.updatedAt)
    });
    redirect(307, `/chat/${chats[0].id}`);
  }

  const [chat, messages] = await Promise.all([
    getChat(params.id),
    getChatMessages(params.id).then((response) => response.reverse())
  ]);

  if (!chat) {
    redirect(307, '/chat');
  }

  if (chat.userId !== user!.id) {
    redirect(307, `/chat`);
  }

  return {
    chat,
    messages
  };
};
