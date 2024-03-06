import { db } from '$lib/server/database';
import { chats as chatsTable } from '@revelationsai/core/database/schema';
import { count } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [chats, chatCount] = await Promise.all([
    db.query.chats.findMany({
      limit: 13,
      orderBy: ({ updatedAt }, { desc }) => desc(updatedAt),
      with: {
        user: true
      }
    }),
    db
      .select({ count: count() })
      .from(chatsTable)
      .then((results) => results[0].count)
  ]);
  return {
    chats,
    chatCount
  };
};
