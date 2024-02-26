import { buildOrderBy, buildQuery } from '@revelationsai/core/database/helpers';
import {
  aiResponses,
  chats,
  roles,
  userMessages,
  users,
  usersToRoles
} from '@revelationsai/core/database/schema';
import { db } from '@revelationsai/server/lib/database';
import {
  createUser,
  deleteUser,
  getUserOrThrow,
  isAdminSync,
  updateUser
} from '@revelationsai/server/services/user';
import { getUserPasswordByUserId } from '@revelationsai/server/services/user/password';
import { and, eq } from 'drizzle-orm';
import type { Resolvers } from '../__generated__/resolver-types';

export const userResolvers: Resolvers = {
  User: {
    password: async (parent, _, { currentUser }) => {
      if (!currentUser || (currentUser.id !== parent.id && !isAdminSync(currentUser))) {
        throw new Error("You are not authorized to view this user's password");
      }
      return await getUserPasswordByUserId(parent.id);
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
    chats: async (
      parent,
      { filter, limit = 25, page = 1, sort = { field: 'createdAt', order: 'desc' } },
      { currentUser }
    ) => {
      if (!currentUser || (currentUser.id !== parent.id && !isAdminSync(currentUser))) {
        throw new Error("You are not authorized to view this user's chats");
      }
      const baseWhere = eq(chats.userId, parent.id);
      const where = filter ? and(baseWhere, buildQuery(chats, filter)) : baseWhere;
      return await db
        .select()
        .from(chats)
        .where(where)
        .orderBy(buildOrderBy(chats, sort!.field, sort!.order))
        .limit(limit!)
        .offset((page! - 1) * limit!);
    },
    messages: async (
      parent,
      { filter, limit = 25, page = 1, sort = { field: 'createdAt', order: 'desc' } },
      { currentUser }
    ) => {
      if (!currentUser || (currentUser.id !== parent.id && !isAdminSync(currentUser))) {
        throw new Error("You are not authorized to view this user's messages");
      }
      const baseWhere = eq(userMessages.userId, parent.id);
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
      if (!currentUser || (currentUser.id !== parent.id && !isAdminSync(currentUser))) {
        throw new Error("You are not authorized to view this user's AI responses");
      }
      const baseWhere = eq(aiResponses.userId, parent.id);
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
  Query: {
    currentUser: async (_, __, { currentUser }) => {
      if (!currentUser) {
        throw new Error('You are not logged in.');
      }
      return await getUserOrThrow(currentUser.id);
    },
    user: async (_, { id }) => {
      return await getUserOrThrow(id);
    },
    users: async (
      _,
      { filter, limit = 25, page = 1, sort = { field: 'createdAt', order: 'desc' } }
    ) => {
      const where = filter ? buildQuery(users, filter) : undefined;
      return await db
        .select()
        .from(users)
        .where(where)
        .orderBy(buildOrderBy(users, sort!.field, sort!.order))
        .limit(limit!)
        .offset((page! - 1) * limit!);
    }
  },
  Mutation: {
    createUser: async (_, { input }, { currentUser }) => {
      if (!currentUser || !isAdminSync(currentUser)) {
        throw new Error('You are not authorized to create users');
      }
      return await createUser(input);
    },
    updateUser: async (_, { id, input }, { currentUser }) => {
      if (!currentUser || (currentUser.id !== id && !isAdminSync(currentUser))) {
        throw new Error('You are not authorized to update this user');
      }
      return await updateUser(id, input);
    },
    deleteUser: async (_, { id }, { currentUser }) => {
      if (!currentUser || (currentUser.id !== id && !isAdminSync(currentUser))) {
        throw new Error('You are not authorized to delete this user');
      }
      return await deleteUser(id);
    }
  }
};
