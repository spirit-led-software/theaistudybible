import { Prisma } from "@prisma/client";

export type GetChatsOptions = {
  query?: Prisma.ChatWhereInput;
  limit?: number;
  offset?: number;
  orderBy?:
    | Prisma.ChatOrderByWithAggregationInput
    | Prisma.ChatOrderByWithRelationInput;
  include?: Prisma.ChatInclude;
};

export type GetChatOptions = {
  include?: Prisma.ChatInclude;
  throwOnNotFound?: boolean;
};
