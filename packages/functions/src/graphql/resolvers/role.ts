import { buildOrderBy, buildQuery } from '@revelationsai/core/database/helpers';
import { roles, users, usersToRoles } from '@revelationsai/core/database/schema';
import { createRoleSchema, updateRoleSchema } from '@revelationsai/core/model/role';
import { db } from '@revelationsai/server/lib/database';
import { isAdminSync } from '@revelationsai/server/services/user';
import { and, desc, eq } from 'drizzle-orm';
import type { Resolvers } from '../__generated__/resolver-types';
import { createObject, deleteObject, getObject, getObjects, updateObject } from '../utils/crud';

export const rolesResolvers: Resolvers = {
  Role: {
    users: async (parent, { filter, limit, page, sort }, { currentUser }) => {
      if (!currentUser || !isAdminSync(currentUser)) {
        throw new Error('You are not authorized to view this resource.');
      }

      limit = limit || 25;
      page = page || 1;
      const query = db
        .select()
        .from(usersToRoles)
        .innerJoin(users, eq(usersToRoles.userId, users.id))
        .limit(limit)
        .offset((page - 1) * limit)
        .$dynamic();

      const where = eq(usersToRoles.roleId, parent.id);
      if (filter) {
        query.where(and(buildQuery(users, filter), where));
      } else {
        query.where(where);
      }

      if (sort) {
        query.orderBy(...sort.map((s) => buildOrderBy(users, s.field, s.order)));
      } else {
        query.orderBy(desc(users.createdAt));
      }

      return await query.then((results) => results.map((result) => result.users));
    }
  },
  Query: {
    role: async (_, { id }, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'admin',
        table: roles,
        id
      });
    },
    roles: async (_, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'admin',
        table: roles,
        ...args
      });
    }
  },
  Mutation: {
    createRole: async (_, { input }, { currentUser }) => {
      return await createObject({
        currentUser,
        role: 'admin',
        table: roles,
        data: input,
        zodSchema: createRoleSchema
      });
    },
    updateRole: async (_, { id, input }, { currentUser }) => {
      return await updateObject({
        currentUser,
        role: 'admin',
        table: roles,
        id,
        data: input,
        zodSchema: updateRoleSchema
      });
    },
    deleteRole: async (_, { id }, { currentUser }) => {
      return await deleteObject({
        currentUser,
        role: 'admin',
        table: roles,
        id
      });
    }
  }
};
