import { userMessages, users } from '@revelationsai/core/database/schema';
import type { Resolvers } from '../../__generated__/resolver-types';
import { deleteObject, getObject, getObjects } from '../../utils/crud';

export const userMessagesResolvers: Resolvers = {
  UserMessage: {
    user: async (parent, __, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'parent-owner',
        parent,
        table: users,
        id: parent.userId
      });
    }
  },
  Query: {
    userMessage: async (_, { id }, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'owner',
        table: userMessages,
        id
      });
    },
    userMessages: async (_, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'owner',
        table: userMessages,
        ...args
      });
    }
  },
  Mutation: {
    deleteUserMessage: async (_, { id }, { currentUser }) => {
      return await deleteObject({
        currentUser,
        role: 'owner',
        table: userMessages,
        id
      });
    }
  }
};
