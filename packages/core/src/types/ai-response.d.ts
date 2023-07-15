import { Prisma } from "@prisma/client";

export declare module "ai-response" {
  interface GetAiResponsesOptions {
    query?: Prisma.AiResponseWhereInput;
    limit?: number;
    offset?: number;
    orderBy?:
      | Prisma.AiResponseOrderByWithAggregationInput
      | Prisma.AiResponseOrderByWithRelationInput;
    include?: Prisma.AiResponseInclude;
  }

  interface GetAiResponseOptions {
    throwOnNotFound?: boolean;
    include?: Prisma.AiResponseInclude;
  }
}
