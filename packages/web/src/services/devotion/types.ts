import { Prisma } from "@prisma/client";

export type GetDevotionsOptions = {
  query?: Prisma.DevotionWhereInput;
  limit?: number;
  offset?: number;
  orderBy?:
    | Prisma.DevotionOrderByWithAggregationInput
    | Prisma.DevotionOrderByWithRelationInput;
  include?: Prisma.DevotionInclude;
};

export type GetDevotionOptions = {
  throwOnNotFound?: boolean;
  include?: Prisma.DevotionInclude;
};
