import type { CreateRoleData, Role, UpdateRoleData } from '@core/model/role';
import { roles, usersToRoles } from '@core/schema';
import { db } from '@lib/database/database';
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

  return await db.select().from(roles).where(where).limit(limit).offset(offset).orderBy(orderBy);
}

export async function getRole(id: string) {
  return (await db.select().from(roles).where(eq(roles.id, id))).at(0);
}

export async function getRoleOrThrow(id: string) {
  const role = await getRole(id);
  if (!role) {
    throw new Error(`Role with id ${id} not found`);
  }
  return role;
}

export async function getRoleByName(name: string) {
  return (await db.select().from(roles).where(eq(roles.name, name))).at(0);
}

export async function getRoleByNameOrThrow(name: string) {
  const role = await getRoleByName(name);
  if (!role) {
    throw new Error(`Role with name ${name} not found`);
  }
  return role;
}

export async function getRolesByUserId(userId: string) {
  const userRolesRelation = await db
    .select()
    .from(usersToRoles)
    .innerJoin(roles, eq(usersToRoles.roleId, roles.id))
    .where(eq(usersToRoles.userId, userId));

  return userRolesRelation.map((userRoleRelation) => userRoleRelation.roles);
}

export async function createRole(data: CreateRoleData) {
  return (
    await db
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

export async function deleteRole(id: string) {
  return (await db.delete(roles).where(eq(roles.id, id)).returning())[0];
}

export async function addRoleToUser(roleName: string, userId: string) {
  const role = await getRoleByNameOrThrow(roleName);
  const user = await getUserOrThrow(userId);

  const userRolesRelation = await db
    .select()
    .from(usersToRoles)
    .where(eq(usersToRoles.userId, userId));

  let userRoles: Role[] = [];
  if (userRolesRelation.length > 0) {
    userRoles = await db
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

  await db.insert(usersToRoles).values({
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
    await db
      .select()
      .from(usersToRoles)
      .where(and(eq(usersToRoles.userId, user.id), eq(usersToRoles.roleId, role.id)))
  )[0];

  if (!userRoleRelation) {
    throw new Error(`User does not have role ${roleName}`);
  }

  await db
    .delete(usersToRoles)
    .where(and(eq(usersToRoles.userId, user.id), eq(usersToRoles.roleId, role.id)));
}

export async function doesUserHaveRole(roleName: string, userId: string) {
  const role = await getRoleByNameOrThrow(roleName);
  const user = await getUserOrThrow(userId);

  const userRoleRelation = (
    await db
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
