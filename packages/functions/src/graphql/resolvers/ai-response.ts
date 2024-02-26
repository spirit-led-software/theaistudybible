import { buildOrderBy, buildQuery } from '@revelationsai/core/database/helpers';
import { aiResponses, chats, userMessages } from '@revelationsai/core/database/schema';
import { db } from '@revelationsai/server/lib/database';
import { deleteAiResponse, getAiResponseOrThrow } from '@revelationsai/server/services/ai-response';
import { getSourceDocumentsByAiResponseId } from '@revelationsai/server/services/source-document';
import { getUserOrThrow, isAdminSync, isObjectOwner } from '@revelationsai/server/services/user';
import { and, eq } from 'drizzle-orm';
import type { Resolvers } from '../__generated__/resolver-types';

export const aiResponseResolvers: Resolvers = {
  AiResponse: {
    user: async (parent, _, { currentUser }) => {
      if (!currentUser || (!isObjectOwner(parent, currentUser.id) && !isAdminSync(currentUser))) {
        throw new Error("You are not authorized to view this AI response's user");
      }
      return await getUserOrThrow(parent.userId);
    },
    chat: async (parent, _, { currentUser }) => {
      if (!currentUser || (!isObjectOwner(parent, currentUser.id) && !isAdminSync(currentUser))) {
        throw new Error("You are not authorized to view this AI response's chat");
      }
      return await db
        .select()
        .from(chats)
        .where(eq(aiResponses.id, parent.chatId))
        .then((results) => results[0]);
    },
    userMessage: async (parent, _, { currentUser }) => {
      if (!currentUser || (!isObjectOwner(parent, currentUser.id) && !isAdminSync(currentUser))) {
        throw new Error("You are not authorized to view this AI response's user message");
      }
      return await db
        .select()
        .from(userMessages)
        .where(eq(userMessages.id, parent.userMessageId))
        .then((results) => results[0]);
    },
    sourceDocuments: async (parent, _, { currentUser }) => {
      if (!currentUser || (!isObjectOwner(parent, currentUser.id) && !isAdminSync(currentUser))) {
        throw new Error("You are not authorized to view this AI response's source documents");
      }
      return await getSourceDocumentsByAiResponseId(parent.id);
    }
  },
  Query: {
    aiResponse: async (_, { id }, { currentUser }) => {
      if (!currentUser) {
        throw new Error('You must be logged in to view an AI response');
      }
      const aiResponse = await getAiResponseOrThrow(id);
      if (!isObjectOwner(aiResponse, currentUser.id) && !isAdminSync(currentUser)) {
        throw new Error('You are not authorized to view this AI response');
      }
      return aiResponse;
    },
    aiResponses: async (
      _,
      { filter, limit = 25, page = 1, sort = { field: 'createdAt', order: 'desc' } },
      { currentUser }
    ) => {
      if (!currentUser) {
        throw new Error('You must be logged in to view AI responses');
      }
      const baseWhere = eq(aiResponses.userId, currentUser.id);
      const where = filter ? and(baseWhere, buildQuery(aiResponses, filter)) : baseWhere;
      return await db
        .select()
        .from(aiResponses)
        .where(where)
        .orderBy(buildOrderBy(aiResponses, sort!.field, sort!.order))
        .limit(limit!)
        .offset((page! - 1) * limit!);
    }
  },
  Mutation: {
    deleteAiResponse: async (_, { id }, { currentUser }) => {
      if (!currentUser) {
        throw new Error('You must be logged in to delete an AI response');
      }
      const aiResponse = await getAiResponseOrThrow(id);
      if (!isObjectOwner(aiResponse, currentUser.id) && !isAdminSync(currentUser)) {
        throw new Error('You are not authorized to delete this AI response');
      }
      return await deleteAiResponse(id);
    }
  }
};
