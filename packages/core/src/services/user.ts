import { SQL, desc, eq } from "drizzle-orm";
import config from "../configs/auth";
import { db } from "../database";
import { CreateUserData, UpdateUserData, User } from "../database/model";
import { roles, users, usersToRoles } from "../database/schema";
import { addRoleToUser } from "./role";

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

  return await db
    .select()
    .from(users)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getUser(id: string) {
  return (await db.select().from(users).where(eq(users.id, id))).at(0);
}

export async function getUserOrThrow(id: string) {
  const user = await getUser(id);
  if (!user) {
    throw new Error(`User with id ${id} not found`);
  }
  return user;
}

export async function getUserByEmail(email: string) {
  return (await db.select().from(users).where(eq(users.email, email))).at(0);
}

export async function getUserByEmailOrThrow(email: string) {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error(`User with email ${email} not found`);
  }
  return user;
}

export async function createUser(data: CreateUserData) {
  return (await db.insert(users).values(data).returning())[0];
}

export async function updateUser(id: string, data: UpdateUserData) {
  return (
    await db.update(users).set(data).where(eq(users.id, id)).returning()
  )[0];
}

export async function deleteUser(id: string) {
  return (await db.delete(users).where(eq(users.id, id)).returning())[0];
}

export async function isAdmin(userId: string) {
  const userRolesRelation = await db
    .select()
    .from(usersToRoles)
    .where(eq(usersToRoles.userId, userId));

  const userRoleNames: string[] = [];
  for (const userRoleRelation of userRolesRelation) {
    const userRoles = await db
      .select()
      .from(roles)
      .where(eq(roles.id, userRoleRelation.roleId));
    userRoles.forEach((userRole) => userRoleNames.push(userRole.name));
  }

  return userRoleNames.some((roleName) => roleName === "ADMIN") ?? false;
}

export function isObjectOwner(object: { userId: string }, userId: string) {
  return object.userId === userId;
}

export async function createInitialAdminUser() {
  console.log("Creating initial admin user");
  let adminUser: User | undefined = await getUserByEmail(
    config.adminUser.email
  );
  if (!adminUser) {
    adminUser = await createUser({
      email: config.adminUser.email,
    });
    console.log("Initial admin user created");
  } else {
    console.log("Admin user already existed");
  }

  console.log("Adding admin role to admin user");
  if (!(await isAdmin(adminUser.id))) {
    await addRoleToUser("ADMIN", adminUser!.id);
    console.log("Admin role added to admin user");
  } else {
    console.log("Admin role already added to admin user");
  }
  console.log("Initial admin user created");
}
