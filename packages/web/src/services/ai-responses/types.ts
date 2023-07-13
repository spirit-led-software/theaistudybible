import { Prisma } from "@prisma/client";

export type GetAiResponsesOptions = {
  query?: Prisma.AiResponseWhereInput;
  limit?: number;
  offset?: number;
  orderBy?:
    | Prisma.AiResponseOrderByWithAggregationInput
    | Prisma.AiResponseOrderByWithRelationInput;
  include?: Prisma.AiResponseInclude;
};

export type GetAiResponseOptions = {
  throwOnNotFound?: boolean;
  include?: Prisma.AiResponseInclude;
};
