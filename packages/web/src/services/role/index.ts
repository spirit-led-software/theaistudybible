import { Prisma, User } from "@prisma/client";
import { prisma } from "@services/database";
import { GetRoleOptions, GetRolesOptions } from "./types";

export async function getRoles(options?: GetRolesOptions) {
  const {
    query,
    limit = 25,
    offset = 0,
    orderBy = {
      createdAt: "desc",
    },
    include = {
      users: true,
    },
  } = options ?? {};

  return await prisma.role.findMany({
    where: query,
    take: limit,
    skip: offset,
    orderBy,
    include,
  });
}

export async function getRole(id: string, options?: GetRoleOptions) {
  const {
    throwOnNotFound = false,
    include = {
      users: true,
    },
  } = options ?? {};

  if (throwOnNotFound) {
    return await prisma.role.findUniqueOrThrow({
      where: {
        id,
      },
      include,
    });
  }

  return await prisma.role.findUnique({
    where: {
      id,
    },
    include,
  });
}

export async function getRoleByName(name: string, options?: GetRoleOptions) {
  const {
    throwOnNotFound = false,
    include = {
      users: true,
    },
  } = options ?? {};

  if (throwOnNotFound) {
    return await prisma.role.findUniqueOrThrow({
      where: {
        name,
      },
      include,
    });
  }

  return await prisma.role.findUnique({
    where: {
      name,
    },
    include,
  });
}

export async function createRole(data: Prisma.RoleCreateInput) {
  return await prisma.role.create({
    data,
  });
}

export async function updateRole(id: string, data: Prisma.RoleUpdateInput) {
  return await prisma.role.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteRole(id: string) {
  const role = await prisma.role.findUniqueOrThrow({
    where: {
      id,
    },
  });

  await prisma.role.delete({
    where: {
      id: role.id,
    },
  });
}

export async function addRoleToUser(roleName: string, user: User) {
  const role = await getRoleByName(roleName, {
    throwOnNotFound: true,
  });

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      roles: {
        connect: {
          id: role!.id,
        },
      },
    },
  });

  return {
    user: updatedUser,
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
