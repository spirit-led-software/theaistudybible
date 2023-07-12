import { authOptions } from "@configs/auth";
import { authConfig } from "@configs/index";
import { Prisma, Role, User } from "@prisma/client";
import { prisma } from "@services/database";
import { getServerSession } from "next-auth";

type GetUsersOptions = {
  query?: Prisma.UserWhereInput;
  limit?: number;
  offset?: number;
  orderBy?:
    | Prisma.UserOrderByWithAggregationInput
    | Prisma.UserOrderByWithRelationInput;
  include?: Prisma.UserInclude;
};

export async function getUsers(options?: GetUsersOptions) {
  const {
    query,
    limit = 25,
    offset = 0,
    orderBy = {
      createdAt: "desc",
    },
    include = {
      roles: {
        include: {
          role: true,
        },
      },
    },
  } = options ?? {};

  const users = await prisma.user.findMany({
    where: query,
    take: limit,
    skip: offset,
    orderBy,
    include,
  });

  return users;
}

type GetUserOptions = {
  include?: Prisma.UserInclude;
  throwOnNotFound?: boolean;
};

export async function getUser(id: string, options?: GetUserOptions) {
  const {
    throwOnNotFound = false,
    include = {
      roles: {
        include: {
          role: true,
        },
      },
    },
  } = options ?? {};

  let user: User | null = null;
  if (throwOnNotFound) {
    user = await prisma.user.findUniqueOrThrow({
      where: {
        id,
      },
      include,
    });
  } else {
    user = await prisma.user.findUnique({
      where: {
        id,
      },
      include,
    });
  }

  return user;
}

export async function getUserByEmail(email: string, options?: GetUserOptions) {
  const {
    throwOnNotFound = false,
    include = {
      roles: {
        include: {
          role: true,
        },
      },
    },
  } = options ?? {};

  let user: User | null = null;
  if (throwOnNotFound) {
    user = await prisma.user.findUniqueOrThrow({
      where: {
        email,
      },
      include,
    });
  } else {
    user = await prisma.user.findUnique({
      where: {
        email,
      },
      include,
    });
  }

  return user;
}

export async function createUser(data: Prisma.UserCreateInput) {
  const user = await prisma.user.create({
    data,
  });

  return user;
}

export async function updateUser(id: string, data: Prisma.UserUpdateInput) {
  const user = await prisma.user.update({
    where: {
      id,
    },
    data,
  });

  return user;
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

export function isAdmin(user: User): boolean {
  return (user as any).roles.some(
    ({ role }: { role: Role }) => role.name === "admin"
  );
}

export async function validServerSession(): Promise<
  | {
      isValid: false;
      user?: User;
    }
  | {
      isValid: true;
      user: User;
    }
> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return { isValid: false };
  }

  const user = await getUserByEmail(session.user.email);
  if (!user) {
    return { isValid: false };
  }

  return {
    isValid: true,
    user,
  };
}

export function isObjectOwner(object: { userId: string }, user: User): boolean {
  return object.userId === user.id;
}

export async function validSessionAndObjectOwner(object: {
  userId: string;
}): Promise<
  | {
      isValid: false;
      user?: User;
    }
  | {
      isValid: true;
      user: User;
    }
> {
  const { isValid, user } = await validServerSession();
  if (!isValid) {
    return { isValid: false };
  }

  if (!isObjectOwner(object, user) && !isAdmin(user)) {
    return { isValid: false, user };
  }

  return { isValid: true, user };
}

export async function createInitialAdminUser() {
  let adminUser = await getUserByEmail(authConfig.adminUser.email);
  if (!adminUser) {
    adminUser = await createUser({
      email: authConfig.adminUser.email,
      roles: {
        create: {
          role: {
            connect: {
              name: "admin",
            },
          },
        },
      },
    });
  }
}
