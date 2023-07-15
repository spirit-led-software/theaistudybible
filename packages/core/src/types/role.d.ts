import { Prisma } from "@prisma/client";

export declare module "role" {
  interface GetRolesOptions {
    query?: Prisma.RoleWhereInput;
    limit?: number;
    offset?: number;
    orderBy?:
      | Prisma.RoleOrderByWithAggregationInput
      | Prisma.RoleOrderByWithRelationInput;
    include?: Prisma.RoleInclude;
  }

  interface GetRoleOptions {
    throwOnNotFound?: boolean;
    include?: Prisma.RoleInclude;
  }
}
