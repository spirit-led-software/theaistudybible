import type { CreateRoleData, Role, UpdateRoleData } from '@core/model';
import { roles, usersToRoles } from '@core/schema';
import { readOnlyDatabase, readWriteDatabase } from '@lib/database';
import { SQL, and, desc, eq, inArray, like } from 'drizzle-orm';
import { getUserOrThrow } from './user/user';

export async function getRoles(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(roles.createdAt) } = options;

  return await readOnlyDatabase
    .select()
    .from(roles)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getRole(id: string) {
  return (await readOnlyDatabase.select().from(roles).where(eq(roles.id, id))).at(0);
}

export async function getRoleOrThrow(id: string) {
  const role = await getRole(id);
  if (!role) {
    throw new Error(`Role with id ${id} not found`);
  }
  return role;
}

export async function getRoleByName(name: string) {
  return (await readOnlyDatabase.select().from(roles).where(eq(roles.name, name))).at(0);
}

export async function getRoleByNameOrThrow(name: string) {
  const role = await getRoleByName(name);
  if (!role) {
    throw new Error(`Role with name ${name} not found`);
  }
  return role;
}

export async function createRole(data: CreateRoleData) {
  return (
    await readWriteDatabase
      .insert(roles)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
  )[0];
}

export async function updateRole(id: string, data: UpdateRoleData) {
  return (
    await readWriteDatabase
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

export async function deleteRole(id: string) {
  return (await readWriteDatabase.delete(roles).where(eq(roles.id, id)).returning())[0];
}

export async function addRoleToUser(roleName: string, userId: string) {
  const role = await getRoleByNameOrThrow(roleName);
  const user = await getUserOrThrow(userId);

  const userRolesRelation = await readOnlyDatabase
    .select()
    .from(usersToRoles)
    .where(eq(usersToRoles.userId, userId));

  let userRoles: Role[] = [];
  if (userRolesRelation.length > 0) {
    userRoles = await readOnlyDatabase
      .select()
      .from(roles)
      .where(
        inArray(
          roles.id,
          userRolesRelation.map((r) => r.roleId)
        )
      );
  }

  if (userRoles.some((r) => r.id === role.id)) {
    throw new Error(`User already has role ${roleName}`);
  }

  await readWriteDatabase.insert(usersToRoles).values({
    userId: user.id,
    roleId: role.id
  });

  return {
    user,
    role
  };
}

export async function removeRoleFromUser(roleName: string, userId: string) {
  const role = await getRoleByNameOrThrow(roleName);
  const user = await getUserOrThrow(userId);

  const userRoleRelation = (
    await readOnlyDatabase
      .select()
      .from(usersToRoles)
      .where(and(eq(usersToRoles.userId, user.id), eq(usersToRoles.roleId, role.id)))
  )[0];

  if (!userRoleRelation) {
    throw new Error(`User does not have role ${roleName}`);
  }

  await readWriteDatabase
    .delete(usersToRoles)
    .where(and(eq(usersToRoles.userId, user.id), eq(usersToRoles.roleId, role.id)));
}

export async function doesUserHaveRole(roleName: string, userId: string) {
  const role = await getRoleByNameOrThrow(roleName);
  const user = await getUserOrThrow(userId);

  const userRoleRelation = (
    await readOnlyDatabase
      .select()
      .from(usersToRoles)
      .where(and(eq(usersToRoles.userId, user.id), eq(usersToRoles.roleId, role.id)))
  )[0];

  return !!userRoleRelation;
}

export async function getStripeRoles() {
  return await getRoles({
    where: like(roles.name, 'stripe:%')
  });
}

export async function deleteStripeRoles() {
  return await readWriteDatabase
    .delete(roles)
    .where(like(roles.name, 'stripe:%'))
    .returning({ id: roles.id });
}

export async function getRcRoles() {
  return await getRoles({
    where: like(roles.name, 'rc:%')
  });
}

export async function deleteRcRoles() {
  return await readWriteDatabase
    .delete(roles)
    .where(like(roles.name, 'rc:%'))
    .returning({ id: roles.id });
}
