import { Prisma } from "@prisma/client";

export declare module "user-message" {
  interface GetUserMessagesOptions {
    query?: Prisma.UserMessageWhereInput;
    limit?: number;
    offset?: number;
    orderBy?:
      | Prisma.UserMessageOrderByWithAggregationInput
      | Prisma.UserMessageOrderByWithRelationInput;
    include?: Prisma.UserMessageInclude;
  }

  interface GetUserMessageOptions {
    throwOnNotFound?: boolean;
    include?: Prisma.UserMessageInclude;
  }
}
