import { userPasswords, users } from '@revelationsai/core/database/schema';
import { getUserPasswordByUserId } from '@revelationsai/server/services/user/password';
import type { Resolvers } from '../../__generated__/resolver-types';
import { deleteObject, getObject, getObjects } from '../../utils/crud';

export const userPasswordResolvers: Resolvers = {
  UserPassword: {
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
    currentUserPassword: async (_, __, { currentUser }) => {
      if (!currentUser) {
        throw new Error('You must be logged in to view your password.');
      }
      return await getUserPasswordByUserId(currentUser.id);
    },
    userPassword: async (_, { id }, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'owner',
        table: userPasswords,
        id
      });
    },
    userPasswords: async (_, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'owner',
        table: userPasswords,
        ...args
      });
    }
  },
  Mutation: {
    deleteUserPassword: async (_, { id }, { currentUser }) => {
      return await deleteObject({
        currentUser,
        role: 'owner',
        table: userPasswords,
        id
      });
    }
  }
};
