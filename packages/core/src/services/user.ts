import { Prisma, Role, User } from "@prisma/client";
import { GetUserOptions, GetUsersOptions } from "user";
import config from "../configs/auth";
import { prisma } from "../services/database";
import { addRoleToUser } from "../services/role";

export async function getUsers(options?: GetUsersOptions) {
  const {
    query,
    limit = 25,
    offset = 0,
    orderBy = {
      createdAt: "desc",
    },
    include = {
      roles: true,
    },
  } = options ?? {};

  return await prisma.user.findMany({
    where: query,
    take: limit,
    skip: offset,
    orderBy,
    include,
  });
}

export async function getUser(id: string, options?: GetUserOptions) {
  const {
    throwOnNotFound = false,
    include = {
      roles: true,
    },
  } = options ?? {};

  if (throwOnNotFound) {
    return await prisma.user.findUniqueOrThrow({
      where: {
        id,
      },
      include,
    });
  }

  return await prisma.user.findUnique({
    where: {
      id,
    },
    include,
  });
}

export async function getUserByEmail(email: string, options?: GetUserOptions) {
  const {
    throwOnNotFound = false,
    include = {
      roles: true,
    },
  } = options ?? {};

  if (throwOnNotFound) {
    return await prisma.user.findUniqueOrThrow({
      where: {
        email,
      },
      include,
    });
  }

  return await prisma.user.findUnique({
    where: {
      email,
    },
    include,
  });
}

export async function createUser(data: Prisma.UserCreateInput) {
  return await prisma.user.create({
    data,
  });
}

export async function updateUser(id: string, data: Prisma.UserUpdateInput) {
  return await prisma.user.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteUser(id: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id,
    },
  });

  await prisma.user.delete({
    where: {
      id: user.id,
    },
  });
}

export async function isAdmin(userId: string) {
  const user = await getUser(userId, {
    throwOnNotFound: true,
    include: {
      roles: true,
    },
  });
  return user!.roles?.some((role: Role) => role.name === "ADMIN") ?? false;
}

export function isObjectOwner(object: { userId: string }, user: User) {
  return object.userId === user.id;
}

export async function createInitialAdminUser() {
  console.log("Creating initial admin user");
  let adminUser = await getUserByEmail(config.adminUser.email);
  if (!adminUser) {
    adminUser = await createUser({
      email: config.adminUser.email,
      emailVerified: new Date(),
      name: "Administrator",
    });
    console.log("Initial admin user created");
  } else {
    console.log("Admin user already existed");
  }

  console.log("Adding admin role to admin user");
  if (!(await isAdmin(adminUser.id))) {
    await addRoleToUser("ADMIN", adminUser);
    console.log("Admin role added to admin user");
  } else {
    console.log("Admin role already added to admin user");
  }
  console.log("Initial admin user created");
}
