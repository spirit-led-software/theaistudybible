import { SQL, desc, eq } from "drizzle-orm";
import { readOnlyDatabase, readWriteDatabase } from "../database";
import { CreateRoleData, Role, UpdateRoleData } from "../database/model";
import { roles, usersToRoles } from "../database/schema";
import { getUser } from "./user/user";

export async function getRoles(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const {
    where,
    limit = 25,
    offset = 0,
    orderBy = desc(roles.createdAt),
  } = options;

  return await readOnlyDatabase
    .select()
    .from(roles)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getRole(id: string) {
  return (
    await readOnlyDatabase.select().from(roles).where(eq(roles.id, id))
  ).at(0);
}

export async function getRoleOrThrow(id: string) {
  const role = await getRole(id);
  if (!role) {
    throw new Error(`Role with id ${id} not found`);
  }
  return role;
}

export async function getRoleByName(name: string) {
  return (
    await readOnlyDatabase.select().from(roles).where(eq(roles.name, name))
  ).at(0);
}

export async function getRoleByNameOrThrow(name: string) {
  const role = await getRoleByName(name);
  if (!role) {
    throw new Error(`Role with name ${name} not found`);
  }
  return role;
}

export async function createRole(data: CreateRoleData) {
  return (await readWriteDatabase.insert(roles).values(data).returning())[0];
}

export async function updateRole(id: string, data: UpdateRoleData) {
  return (
    await readWriteDatabase
      .update(roles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, id))
      .returning()
  )[0];
}

export async function deleteRole(id: string) {
  return (
    await readWriteDatabase.delete(roles).where(eq(roles.id, id)).returning()
  )[0];
}

export async function addRoleToUser(roleName: string, userId: string) {
  const role = await getRoleByNameOrThrow(roleName);
  const user = await getUser(userId);

  if (!user) {
    throw new Error(`User with id ${userId} not found`);
  }

  const userRolesRelation = await readOnlyDatabase
    .select()
    .from(usersToRoles)
    .where(eq(usersToRoles.userId, userId));

  const userRoles: Role[] = [];
  for (const userRoleRelation of userRolesRelation) {
    const userRole = (
      await readOnlyDatabase
        .select()
        .from(roles)
        .where(eq(roles.id, userRoleRelation.roleId))
    )[0];
    userRoles.push(userRole);
  }

  if (userRoles.some((r) => r.id === role.id)) {
    throw new Error(`User already has role ${roleName}`);
  }

  await readWriteDatabase.insert(usersToRoles).values({
    userId: user.id,
    roleId: role.id,
  });

  return {
    user,
    role,
  };
}

export async function createInitialRoles() {
  console.log("Creating initial roles");

  console.log("Creating admin role");
  let adminRole = await getRoleByName("ADMIN");
  if (!adminRole) {
    adminRole = await createRole({
      name: "ADMIN",
    });
    console.log("Admin role created");
  } else {
    console.log("Admin role already exists");
  }

  console.log("Creating moderator role");
  let moderatorRole = await getRoleByName("MODERATOR");
  if (!moderatorRole) {
    moderatorRole = await createRole({
      name: "MODERATOR",
    });
    console.log("Moderator role created");
  } else {
    console.log("Moderator role already exists");
  }

  console.log("Creating default user role");
  let userRole = await getRoleByName("USER");
  if (!userRole) {
    userRole = await createRole({
      name: "USER",
    });
    console.log("Default user role created");
  } else {
    console.log("Default user role already exists");
  }

  console.log("Initial roles created");
}
