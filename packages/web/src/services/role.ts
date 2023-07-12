import { Prisma, Role } from "@prisma/client";
import { prisma } from "@services/database";

type GetRolesOptions = {
  query?: Prisma.RoleWhereInput;
  limit?: number;
  offset?: number;
  orderBy?:
    | Prisma.RoleOrderByWithAggregationInput
    | Prisma.RoleOrderByWithRelationInput;
  include?: Prisma.RoleInclude;
};

export async function getRoles(options?: GetRolesOptions) {
  const {
    query,
    limit = 25,
    offset = 0,
    orderBy = {
      createdAt: "desc",
    },
    include = {
      users: {
        include: {
          user: true,
        },
      },
    },
  } = options ?? {};

  const roles = await prisma.role.findMany({
    where: query,
    take: limit,
    skip: offset,
    orderBy,
    include,
  });

  return roles;
}

type GetRoleOptions = {
  include?: Prisma.RoleInclude;
  throwOnNotFound?: boolean;
};

export async function getRole(id: string, options?: GetRoleOptions) {
  const {
    throwOnNotFound = false,
    include = {
      users: {
        include: {
          user: true,
        },
      },
    },
  } = options ?? {};

  let role: Role | null = null;
  if (throwOnNotFound) {
    role = await prisma.role.findUniqueOrThrow({
      where: {
        id,
      },
      include,
    });
  } else {
    role = await prisma.role.findUnique({
      where: {
        id,
      },
      include,
    });
  }

  return role;
}

export async function getRoleByName(name: string, options?: GetRoleOptions) {
  const {
    throwOnNotFound = false,
    include = {
      users: {
        include: {
          user: true,
        },
      },
    },
  } = options ?? {};

  let role: Role | null = null;
  if (throwOnNotFound) {
    role = await prisma.role.findUniqueOrThrow({
      where: {
        name,
      },
      include,
    });
  } else {
    role = await prisma.role.findUnique({
      where: {
        name,
      },
      include,
    });
  }

  return role;
}

export async function createRole(data: Prisma.RoleCreateInput) {
  const role = await prisma.role.create({
    data,
  });

  return role;
}

export async function updateRole(id: string, data: Prisma.RoleUpdateInput) {
  const role = await prisma.role.update({
    where: {
      id,
    },
    data,
  });

  return role;
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

export async function createInitialRoles() {
  let adminRole = await getRoleByName("admin");
  if (!adminRole) {
    adminRole = await createRole({
      name: "admin",
    });
  }

  let moderatorRole = await getRoleByName("moderator");
  if (!moderatorRole) {
    moderatorRole = await createRole({
      name: "moderator",
    });
  }

  let userRole = await getRoleByName("user");
  if (!userRole) {
    userRole = await createRole({
      name: "user",
    });
  }
}
