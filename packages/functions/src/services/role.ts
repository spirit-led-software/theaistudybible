import type { CreateRoleData, Role, UpdateRoleData } from '@core/model/role';
import { roles, usersToRoles } from '@core/schema';
import { db } from '@lib/database/database';
import { SQL, and, desc, eq, like } from 'drizzle-orm';
import { cacheDelete, cacheGet, cacheUpsert, type CacheKeysInput } from './cache';
import { getUserOrThrow } from './user/user';

export const ROLES_CACHE_COLLECTION = roles._.name;
export const defaultCacheKeysFn: CacheKeysInput<Role> = (role) => [
  { keyName: roles.id._.name, keyValue: role.id },
  { keyName: roles.name._.name, keyValue: role.name }
];

export async function getRoles(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(roles.createdAt) } = options;

  return await db.select().from(roles).where(where).limit(limit).offset(offset).orderBy(orderBy);
}

export async function getRole(id: string) {
  return await cacheGet({
    collection: ROLES_CACHE_COLLECTION,
    key: { keyName: roles.id._.name, keyValue: id },
    fn: async () => (await db.select().from(roles).where(eq(roles.id, id))).at(0)
  });
}

export async function getRoleOrThrow(id: string) {
  const role = await getRole(id);
  if (!role) {
    throw new Error(`Role with id ${id} not found`);
  }
  return role;
}

export async function getRoleByName(name: string) {
  return await cacheGet({
    collection: ROLES_CACHE_COLLECTION,
    key: { keyName: roles.name._.name, keyValue: name },
    fn: async () => (await db.select().from(roles).where(eq(roles.name, name))).at(0)
  });
}

export async function getRoleByNameOrThrow(name: string) {
  const role = await getRoleByName(name);
  if (!role) {
    throw new Error(`Role with name ${name} not found`);
  }
  return role;
}

export async function createRole(data: CreateRoleData) {
  return await cacheUpsert({
    collection: ROLES_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .insert(roles)
          .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning()
      )[0]
  });
}

export async function updateRole(id: string, data: UpdateRoleData) {
  return await cacheUpsert({
    collection: ROLES_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () => {
      return (
        await db
          .update(roles)
          .set({
            ...data,
            createdAt: undefined,
            updatedAt: new Date()
          })
          .where(eq(roles.id, id))
          .returning()
      )[0];
    }
  });
}

export async function deleteRole(id: string) {
  return await cacheDelete({
    collection: ROLES_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () => {
      return (await db.delete(roles).where(eq(roles.id, id)).returning())[0];
    }
  });
}

export async function getRolesByUserId(userId: string) {
  return await cacheGet({
    collection: ROLES_CACHE_COLLECTION,
    key: { keyName: usersToRoles.userId._.name, keyValue: userId },
    fn: async () => {
      const userRolesRelation = await db
        .select()
        .from(usersToRoles)
        .innerJoin(roles, eq(usersToRoles.roleId, roles.id))
        .where(eq(usersToRoles.userId, userId));

      return userRolesRelation.map((userRoleRelation) => userRoleRelation.roles);
    }
  });
}

export async function addRoleToUser(roleName: string, userId: string) {
  const role = await getRoleByNameOrThrow(roleName);
  const user = await getUserOrThrow(userId);

  await cacheDelete({
    collection: ROLES_CACHE_COLLECTION,
    keys: (userRoleRelation) => [
      { keyName: usersToRoles.userId._.name, keyValue: userRoleRelation.userId }
    ],
    fn: async () =>
      (
        await db
          .insert(usersToRoles)
          .values({
            userId: user.id,
            roleId: role.id
          })
          .returning()
      )[0]
  });

  return {
    user,
    role
  };
}

export async function removeRoleFromUser(roleName: string, userId: string) {
  const role = await getRoleByNameOrThrow(roleName);
  const user = await getUserOrThrow(userId);

  await cacheDelete({
    collection: ROLES_CACHE_COLLECTION,
    keys: (userRoleRelation) => [
      { keyName: usersToRoles.userId._.name, keyValue: userRoleRelation.userId }
    ],
    fn: async () =>
      (
        await db
          .delete(usersToRoles)
          .where(and(eq(usersToRoles.userId, user.id), eq(usersToRoles.roleId, role.id)))
          .returning()
      )[0]
  });
}

export async function doesUserHaveRole(roleName: string, userId: string) {
  const roles = await getRolesByUserId(userId);
  return roles.some((role) => role.name === roleName);
}

export async function getStripeRoles() {
  return await getRoles({
    where: like(roles.name, 'stripe:%')
  });
}

export async function deleteStripeRoles() {
  return await db.delete(roles).where(like(roles.name, 'stripe:%')).returning();
}

export async function getRcRoles() {
  return await getRoles({
    where: like(roles.name, 'rc:%')
  });
}

export async function deleteRcRoles() {
  return await db.delete(roles).where(like(roles.name, 'rc:%')).returning();
}
