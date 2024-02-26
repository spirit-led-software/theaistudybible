import { buildOrderBy, buildQuery } from '@revelationsai/core/database/helpers';
import { aiResponses, chats, userMessages } from '@revelationsai/core/database/schema';
import { db } from '@revelationsai/server/lib/database';
import {
  createChat,
  deleteChat,
  getChatOrThrow,
  updateChat
} from '@revelationsai/server/services/chat';
import { getChatMessages } from '@revelationsai/server/services/chat/message';
import { getUserOrThrow, isAdminSync, isObjectOwner } from '@revelationsai/server/services/user';
import { and, eq } from 'drizzle-orm';
import type { Resolvers } from '../__generated__/resolver-types';

export const chatResolvers: Resolvers = {
  Chat: {
    user: async (parent, _, { currentUser }) => {
      if (!currentUser || (currentUser.id !== parent.userId && !isAdminSync(currentUser))) {
        throw new Error("You are not authorized to view this chat's user");
      }
      return await getUserOrThrow(parent.userId);
    },
    userMessages: async (
      parent,
      { filter, limit = 25, page = 1, sort = { field: 'createdAt', order: 'desc' } },
      { currentUser }
    ) => {
      if (!currentUser || (currentUser.id !== parent.userId && !isAdminSync(currentUser))) {
        throw new Error("You are not authorized to view this chat's user messages");
      }
      const baseWhere = eq(userMessages.chatId, parent.id);
      const where = filter ? and(baseWhere, buildQuery(userMessages, filter)) : baseWhere;
      return await db
        .select()
        .from(userMessages)
        .where(where)
        .orderBy(buildOrderBy(userMessages, sort!.field, sort!.order))
        .limit(limit!)
        .offset((page! - 1) * limit!);
    },
    aiResponses: async (
      parent,
      { filter, limit = 25, page = 1, sort = { field: 'createdAt', order: 'desc' } },
      { currentUser }
    ) => {
      if (!currentUser || (currentUser.id !== parent.userId && !isAdminSync(currentUser))) {
        throw new Error("You are not authorized to view this chat's AI responses");
      }
      const baseWhere = eq(aiResponses.chatId, parent.id);
      const where = filter ? and(baseWhere, buildQuery(aiResponses, filter)) : baseWhere;
      return await db
        .select()
        .from(aiResponses)
        .where(where)
        .orderBy(buildOrderBy(aiResponses, sort!.field, sort!.order))
        .limit(limit!)
        .offset((page! - 1) * limit!);
    },
    chatMessages: async (
      parent,
      { limit = 25, page = 1, sort = { field: 'createdAt', order: 'desc' } },
      { currentUser }
    ) => {
      if (!currentUser || (currentUser.id !== parent.userId && !isAdminSync(currentUser))) {
        throw new Error("You are not authorized to view this chat's user messages");
      }
      return await getChatMessages(parent.id, {
        limit: limit!,
        offset: (page! - 1) * limit!,
        orderBy: buildOrderBy(aiResponses, sort!.field, sort!.order)
      });
    }
  },
  Query: {
    chat: async (_, { id }, { currentUser }) => {
      if (!currentUser) {
        throw new Error('You must be logged in to view chats');
      }
      const chat = await getChatOrThrow(id);
      if (!isObjectOwner(chat, currentUser.id) && !isAdminSync(currentUser)) {
        throw new Error('You are not authorized to view this chat');
      }
      return chat;
    },
    chats: async (
      _,
      { filter, limit = 25, page = 1, sort = { field: 'createdAt', order: 'desc' } },
      { currentUser }
    ) => {
      if (!currentUser) {
        throw new Error('You must be logged in to view chats');
      }
      const baseWhere = isAdminSync(currentUser) ? undefined : eq(chats.userId, currentUser.id);
      const where = filter ? and(buildQuery(chats, filter), baseWhere) : baseWhere;
      return await db
        .select()
        .from(chats)
        .where(where)
        .orderBy(buildOrderBy(chats, sort!.field, sort!.order))
        .limit(limit!)
        .offset((page! - 1) * limit!);
    },
    chatMessages: async (
      _,
      { chatId, limit = 25, page = 1, sort = { field: 'createdAt', order: 'desc' } },
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
        orderBy: buildOrderBy(aiResponses, sort!.field, sort!.order)
      });
    }
  },
  Mutation: {
    createChat: async (_, { input }, { currentUser }) => {
      if (!currentUser) {
        throw new Error('You must be logged in to create a chat');
      }
      if (input.userId && input.userId !== currentUser.id && !isAdminSync(currentUser)) {
        throw new Error('You are not authorized to create a chat for another user');
      }
      return await createChat({
        ...input,
        userId: input.userId || currentUser.id
      });
    },
    updateChat: async (_, { id, input }, { currentUser }) => {
      const chat = await getChatOrThrow(id);
      if (!currentUser || (!isObjectOwner(chat, currentUser.id) && !isAdminSync(currentUser))) {
        throw new Error('You are not authorized to update this chat');
      }
      return await updateChat(id, input);
    },
    deleteChat: async (_, { id }, { currentUser }) => {
      const chat = await getChatOrThrow(id);
      if (!currentUser || (!isObjectOwner(chat, currentUser.id) && !isAdminSync(currentUser))) {
        throw new Error('You are not authorized to delete this chat');
      }
      return await deleteChat(id);
    }
  }
};
