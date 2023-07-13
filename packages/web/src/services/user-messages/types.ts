import { Prisma } from "@prisma/client";

export type GetUserMessagesOptions = {
  query?: Prisma.UserMessageWhereInput;
  limit?: number;
  offset?: number;
  orderBy?:
    | Prisma.UserMessageOrderByWithAggregationInput
    | Prisma.UserMessageOrderByWithRelationInput;
  include?: Prisma.UserMessageInclude;
};

export type GetUserMessageOptions = {
  throwOnNotFound?: boolean;
  include?: Prisma.UserMessageInclude;
};
