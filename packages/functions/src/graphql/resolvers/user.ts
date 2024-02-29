import {
  aiResponses,
  chats,
  devotionReactions,
  roles,
  userMessages,
  userPasswords,
  users,
  usersToRoles
} from '@revelationsai/core/database/schema';
import { createUserSchema, updateUserSchema } from '@revelationsai/core/model/user';
import { db } from '@revelationsai/server/lib/database';
import { isAdminSync } from '@revelationsai/server/services/user';
import { eq } from 'drizzle-orm';
import { aiResponseReactions } from '../../../../core/src/database/schema';
import type { Resolvers } from '../__generated__/resolver-types';
import {
  createObject,
  deleteObject,
  getObject,
  getObjectCount,
  getObjects,
  updateObject
} from '../utils/crud';

export const userResolvers: Resolvers = {
  User: {
    password: async (parent, _, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'parent-owner',
        parent,
        table: userPasswords,
        id: parent.id,
        ownershipField: 'id'
      });
    },
    roles: async (parent, _, { currentUser }) => {
      if (!currentUser || (currentUser.id !== parent.id && !isAdminSync(currentUser))) {
        throw new Error("You are not authorized to view this user's roles");
      }
      return await db
        .select()
        .from(usersToRoles)
        .where(eq(usersToRoles.userId, parent.id))
        .innerJoin(roles, eq(usersToRoles.roleId, roles.id))
        .then((results) => results.map((result) => result.roles));
    },
    chatCount: async (parent, _, { currentUser }) => {
      return await getObjectCount({
        currentUser,
        role: 'parent-owner',
        parent,
        table: chats,
        where: eq(chats.userId, parent.id)
      });
    },
    chats: async (parent, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'parent-owner',
        parent,
        table: chats,
        where: eq(chats.userId, parent.id),
        ownershipField: 'id',
        ...args
      });
    },
    messages: async (parent, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'parent-owner',
        parent,
        table: userMessages,
        where: eq(userMessages.userId, parent.id),
        ownershipField: 'id',
        ...args
      });
    },
    aiResponses: async (parent, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'parent-owner',
        parent,
        table: aiResponses,
        where: eq(aiResponses.userId, parent.id),
        ownershipField: 'id',
        ...args
      });
    },
    aiResponseReactions: async (parent, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'parent-owner',
        parent,
        table: aiResponseReactions,
        where: eq(aiResponseReactions.userId, parent.id),
        ownershipField: 'id',
        ...args
      });
    },
    devotionReactionCount: async (parent, _, { currentUser }) => {
      return await getObjectCount({
        currentUser,
        role: 'parent-owner',
        parent,
        table: devotionReactions,
        where: eq(devotionReactions.userId, parent.id)
      });
    },
    devotionReactions: async (parent, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'parent-owner',
        parent,
        table: devotionReactions,
        where: eq(devotionReactions.userId, parent.id),
        ownershipField: 'id',
        ...args
      });
    }
  },
  Query: {
    currentUser: async (_, __, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'user',
        table: users,
        id: currentUser!.id
      });
    },
    user: async (_, { id }, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'public',
        table: users,
        id
      });
    },
    users: async (_, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'public',
        table: users,
        ...args
      });
    }
  },
  Mutation: {
    createUser: async (_, { input }, { currentUser }) => {
      return await createObject({
        currentUser,
        role: 'admin',
        table: users,
        data: input,
        zodSchema: createUserSchema
      });
    },
    updateUser: async (_, { id, input }, { currentUser }) => {
      return await updateObject({
        currentUser,
        role: 'owner',
        table: users,
        id,
        data: input,
        zodSchema: updateUserSchema,
        ownershipField: 'id'
      });
    },
    deleteUser: async (_, { id }, { currentUser }) => {
      return await deleteObject({
        currentUser,
        role: 'owner',
        table: users,
        id,
        ownershipField: 'id'
      });
    }
  }
};
