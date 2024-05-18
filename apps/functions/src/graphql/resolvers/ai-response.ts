import { aiResponses, chats, userMessages, users } from '@revelationsai/core/database/schema';
import { getSourceDocumentsByAiResponseId } from '@revelationsai/server/services/source-document';
import { isAdminSync, isObjectOwner } from '@revelationsai/server/services/user';
import type { Resolvers } from '../__generated__/resolver-types';
import { deleteObject, getObject, getObjects } from '../utils/crud';

export const aiResponseResolvers: Resolvers = {
  AiResponse: {
    user: async (parent, _, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'parent-owner',
        parent,
        table: users,
        id: parent.userId
      });
    },
    chat: async (parent, _, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'parent-owner',
        parent,
        table: chats,
        id: parent.chatId
      });
    },
    userMessage: async (parent, _, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'parent-owner',
        parent,
        table: userMessages,
        id: parent.userMessageId
      });
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
      return await getObject({
        currentUser,
        role: 'owner',
        table: aiResponses,
        id
      });
    },
    aiResponses: async (_, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'owner',
        table: aiResponses,
        ...args
      });
    }
  },
  Mutation: {
    deleteAiResponse: async (_, { id }, { currentUser }) => {
      return await deleteObject({
        currentUser,
        role: 'owner',
        table: aiResponses,
        id
      });
    }
  }
};
