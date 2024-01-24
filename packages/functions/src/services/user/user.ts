import type { CreateUserData, UpdateUserData, User, UserWithRoles } from '@core/model/user';
import { roles, users, usersToRoles } from '@core/schema';
import { db } from '@lib/database/database';
import { cacheDelete, cacheGet, cacheUpsert, type CacheKeysInput } from '@services/cache';
import { SQL, desc, eq, sql } from 'drizzle-orm';

export const USERS_CACHE_COLLECTION = users._.name;
export const defaultCacheKeysFn: CacheKeysInput<User> = (user) => [
  { keyName: users.id._.name, keyValue: user.id },
  { keyName: users.email._.name, keyValue: user.email },
  { keyName: users.stripeCustomerId._.name, keyValue: user.stripeCustomerId }
];

export async function getUsers(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(users.createdAt) } = options;
  return await db.select().from(users).where(where).limit(limit).offset(offset).orderBy(orderBy);
}

export async function getUser(id: string) {
  return await cacheGet({
    collection: USERS_CACHE_COLLECTION,
    key: { keyName: users.id._.name, keyValue: id },
    fn: async () => (await db.select().from(users).where(eq(users.id, id))).at(0)
  });
}

export async function getUserOrThrow(id: string) {
  const user = await getUser(id);
  if (!user) {
    throw new Error(`User with id ${id} not found`);
  }
  return user;
}

export async function getUserByEmail(email: string) {
  return await cacheGet({
    collection: USERS_CACHE_COLLECTION,
    key: { keyName: users.email._.name, keyValue: email },
    fn: async () => (await db.select().from(users).where(eq(users.email, email))).at(0)
  });
}

export async function getUserByEmailOrThrow(email: string) {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error(`User with email ${email} not found`);
  }
  return user;
}

export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  return await cacheGet({
    collection: USERS_CACHE_COLLECTION,
    key: { keyName: users.stripeCustomerId._.name, keyValue: stripeCustomerId },
    fn: async () =>
      (await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId))).at(0)
  });
}

export async function createUser(data: CreateUserData) {
  return await cacheUpsert<User>({
    collection: USERS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () => {
      return (
        await db
          .insert(users)
          .values({
            hasCustomImage: data.image ? true : false,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning()
      )[0];
    }
  });
}

export async function updateUser(id: string, data: UpdateUserData) {
  return await cacheUpsert<User>({
    collection: USERS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .update(users)
          .set({
            hasCustomImage: sql`${users.hasCustomImage} OR ${data.image ? true : false}`,
            ...data,
            createdAt: undefined,
            updatedAt: new Date()
          })
          .where(eq(users.id, id))
          .returning()
      )[0]
  });
}

export async function deleteUser(id: string) {
  return await cacheDelete({
    collection: USERS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () => {
      return (await db.delete(users).where(eq(users.id, id)).returning())[0];
    }
  });
}

export async function isAdmin(userId: string) {
  const userRolesRelation = await db
    .select()
    .from(usersToRoles)
    .where(eq(usersToRoles.userId, userId))
    .rightJoin(roles, eq(roles.id, usersToRoles.roleId));

  return userRolesRelation.some((userRoleRelation) => {
    return userRoleRelation.roles.name === 'admin';
  });
}

export function isAdminSync(userWithRoles: UserWithRoles) {
  return userWithRoles.roles.some((role) => role.name === 'admin');
}

export async function hasPlus(userId: string) {
  const userRolesRelation = await db
    .select()
    .from(usersToRoles)
    .where(eq(usersToRoles.userId, userId))
    .rightJoin(roles, eq(roles.id, usersToRoles.roleId));

  return userRolesRelation.some((userRoleRelation) => {
    return userRoleRelation.roles.name === 'rc:plus';
  });
}

export function hasPlusSync(userWithRoles: UserWithRoles) {
  return userWithRoles.roles.some((role) => role.name === 'rc:plus');
}

export function isObjectOwner(object: { userId: string }, userId: string) {
  return object.userId === userId;
}

export function getUserMaxQueries(userWithRoles: UserWithRoles) {
  const queryPermissions: string[] = [];
  userWithRoles.roles.forEach((role) => {
    const queryPermission = role.permissions.find((permission) => {
      return permission.startsWith('query:');
    });
    if (queryPermission) queryPermissions.push(queryPermission);
  });
  const maxQueries = Math.max(5, ...queryPermissions.map((p) => parseInt(p.split(':')[1])));
  return maxQueries;
}

export function getUserMaxGeneratedImages(userWithRoles: UserWithRoles) {
  const imagePermissions: string[] = [];
  userWithRoles.roles.forEach((role) => {
    const queryPermission = role.permissions.find((permission) => {
      return permission.startsWith('image:');
    });
    if (queryPermission) imagePermissions.push(queryPermission);
  });
  const maxQueries = Math.max(1, ...imagePermissions.map((p) => parseInt(p.split(':')[1])));
  return maxQueries;
}
