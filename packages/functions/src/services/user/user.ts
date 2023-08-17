import { authConfig } from "@core/configs";
import { CreateUserData, UpdateUserData, User } from "@core/model";
import { roles, users, usersToRoles } from "@core/schema";
import { readOnlyDatabase, readWriteDatabase } from "@lib/database";
import { SQL, desc, eq, or } from "drizzle-orm";
import { addRoleToUser } from "../role";

export async function getUsers(
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
    orderBy = desc(users.createdAt),
  } = options;

  return await readOnlyDatabase
    .select()
    .from(users)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getUser(id: string) {
  return (
    await readOnlyDatabase.select().from(users).where(eq(users.id, id))
  ).at(0);
}

export async function getUserOrThrow(id: string) {
  const user = await getUser(id);
  if (!user) {
    throw new Error(`User with id ${id} not found`);
  }
  return user;
}

export async function getUserRoles(id: string) {
  const user = await getUserOrThrow(id);

  const userRolesRelation = await readOnlyDatabase
    .select()
    .from(usersToRoles)
    .where(eq(usersToRoles.userId, user.id));

  const userRoles = await readOnlyDatabase
    .select()
    .from(roles)
    .where(
      or(
        ...userRolesRelation.map((userRoleRelation) =>
          eq(roles.id, userRoleRelation.roleId)
        )
      )
    );

  return userRoles;
}

export async function getUserByEmail(email: string) {
  return (
    await readOnlyDatabase.select().from(users).where(eq(users.email, email))
  ).at(0);
}

export async function getUserByEmailOrThrow(email: string) {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error(`User with email ${email} not found`);
  }
  return user;
}

export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  return (
    await readOnlyDatabase
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, stripeCustomerId))
  ).at(0);
}

export async function createUser(data: CreateUserData) {
  return (await readWriteDatabase.insert(users).values(data).returning())[0];
}

export async function updateUser(id: string, data: UpdateUserData) {
  return (
    await readWriteDatabase
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning()
  )[0];
}

export async function deleteUser(id: string) {
  return (
    await readWriteDatabase.delete(users).where(eq(users.id, id)).returning()
  )[0];
}

export async function isAdmin(userId: string) {
  const userRolesRelation = await readOnlyDatabase
    .select()
    .from(usersToRoles)
    .where(eq(usersToRoles.userId, userId))
    .rightJoin(roles, eq(roles.id, usersToRoles.roleId));

  return userRolesRelation.some((userRoleRelation) => {
    return userRoleRelation.roles.name === "admin";
  });
}

export function isObjectOwner(object: { userId: string }, userId: string) {
  return object.userId === userId;
}

export async function createInitialAdminUser() {
  console.log("Creating initial admin user");
  let adminUser: User | undefined = await getUserByEmail(
    authConfig.adminUser.email
  );
  if (!adminUser) {
    adminUser = await createUser({
      email: authConfig.adminUser.email,
    });
    console.log("Initial admin user created");
  } else {
    console.log("Admin user already existed");
  }

  console.log("Adding admin role to admin user");
  if (!(await isAdmin(adminUser.id))) {
    await addRoleToUser("admin", adminUser.id);
    console.log("Admin role added to admin user");
  } else {
    console.log("Admin role already added to admin user");
  }
  console.log("Initial admin user created");
}
