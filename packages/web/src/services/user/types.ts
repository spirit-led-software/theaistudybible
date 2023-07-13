import { Prisma, Role, User } from "@prisma/client";

export type GetUsersOptions = {
  query?: Prisma.UserWhereInput;
  limit?: number;
  offset?: number;
  orderBy?:
    | Prisma.UserOrderByWithAggregationInput
    | Prisma.UserOrderByWithRelationInput;
  include?: Prisma.UserInclude;
};

export type GetUserOptions = {
  include?: Prisma.UserInclude;
  throwOnNotFound?: boolean;
};

export type UserWithRoles = User & {
  roles: Role[];
};
