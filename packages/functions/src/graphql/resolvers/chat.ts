import { buildOrderBy } from '@revelationsai/core/database/helpers';
import { aiResponses, chats, userMessages, users } from '@revelationsai/core/database/schema';
import { createChatSchema, updateChatSchema } from '@revelationsai/core/model/chat';
import { getChatOrThrow } from '@revelationsai/server/services/chat';
import { getChatMessages } from '@revelationsai/server/services/chat/message';
import { isAdminSync, isObjectOwner } from '@revelationsai/server/services/user';
import { eq } from 'drizzle-orm';
import type { Resolvers } from '../__generated__/resolver-types';
import { createObject, deleteObject, getObject, getObjects, updateObject } from '../utils/crud';

export const chatResolvers: Resolvers = {
  Chat: {
    user: async (parent, _, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'parent-owner',
        parent,
        table: users,
        id: parent.userId
      });
    },
    userMessages: async (parent, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'parent-owner',
        parent,
        table: userMessages,
        where: eq(userMessages.chatId, parent.id),
        ...args
      });
    },
    aiResponses: async (parent, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'parent-owner',
        parent,
        table: aiResponses,
        where: eq(aiResponses.chatId, parent.id),
        ...args
      });
    },
    chatMessages: async (
      parent,
      { limit = 25, page = 1, sort = [{ field: 'createdAt', order: 'desc' }] },
      { currentUser }
    ) => {
      if (!currentUser || (!isObjectOwner(parent, currentUser.id) && !isAdminSync(currentUser))) {
        throw new Error("You are not authorized to view this chat's user messages");
      }
      return await getChatMessages(parent.id, {
        limit: limit!,
        offset: (page! - 1) * limit!,
        orderBy: sort?.map((s) => buildOrderBy(aiResponses, s!.field, s!.order))
      });
    }
  },
  Query: {
    chat: async (_, { id }, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'owner',
        table: chats,
        id
      });
    },
    chats: async (_, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'owner',
        table: chats,
        ...args
      });
    },
    chatMessages: async (
      _,
      { chatId, limit = 25, page = 1, sort = [{ field: 'createdAt', order: 'desc' }] },
      { currentUser }
    ) => {
      if (!currentUser) {
        throw new Error('You must be logged in to view chat messages');
      }
      const chat = await getChatOrThrow(chatId);
      if (currentUser.id !== chat.userId && !isAdminSync(currentUser)) {
        throw new Error("You are not authorized to view this chat's messages");
      }
      return await getChatMessages(chatId, {
        limit: limit!,
        offset: (page! - 1) * limit!,
        orderBy: sort?.map((s) => buildOrderBy(aiResponses, s!.field, s!.order))
      });
    }
  },
  Mutation: {
    createChat: async (_, { input }, { currentUser }) => {
      return await createObject({
        currentUser,
        role: 'user',
        table: chats,
        data: input,
        zodSchema: createChatSchema
      });
    },
    updateChat: async (_, { id, input }, { currentUser }) => {
      return await updateObject({
        currentUser,
        role: 'owner',
        table: chats,
        id,
        data: input,
        zodSchema: updateChatSchema
      });
    },
    deleteChat: async (_, { id }, { currentUser }) => {
      return await deleteObject({
        currentUser,
        role: 'owner',
        table: chats,
        id
      });
    }
  }
};
