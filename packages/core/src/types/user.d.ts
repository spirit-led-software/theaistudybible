import { Prisma } from "@prisma/client";

export declare module "user" {
  interface GetUsersOptions {
    query?: Prisma.UserWhereInput;
    limit?: number;
    offset?: number;
    orderBy?:
      | Prisma.UserOrderByWithAggregationInput
      | Prisma.UserOrderByWithRelationInput;
    include?: Prisma.UserInclude;
  }

  interface GetUserOptions {
    include?: Prisma.UserInclude;
    throwOnNotFound?: boolean;
  }
}
