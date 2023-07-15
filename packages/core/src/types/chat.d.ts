import { Prisma } from "@prisma/client";

export declare module "chat" {
  interface GetChatsOptions {
    query?: Prisma.ChatWhereInput;
    limit?: number;
    offset?: number;
    orderBy?:
      | Prisma.ChatOrderByWithAggregationInput
      | Prisma.ChatOrderByWithRelationInput;
    include?: Prisma.ChatInclude;
  }

  interface GetChatOptions {
    include?: Prisma.ChatInclude;
    throwOnNotFound?: boolean;
  }
}
