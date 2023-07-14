import { Prisma } from "@prisma/client";

export type GetRolesOptions = {
  query?: Prisma.RoleWhereInput;
  limit?: number;
  offset?: number;
  orderBy?:
    | Prisma.RoleOrderByWithAggregationInput
    | Prisma.RoleOrderByWithRelationInput;
  include?: Prisma.RoleInclude;
};

export type GetRoleOptions = {
  throwOnNotFound?: boolean;
  include?: Prisma.RoleInclude;
};
