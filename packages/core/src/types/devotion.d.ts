import { Prisma } from "@prisma/client";

export declare module "devotion" {
  interface GetDevotionsOptions {
    query?: Prisma.DevotionWhereInput;
    limit?: number;
    offset?: number;
    orderBy?:
      | Prisma.DevotionOrderByWithAggregationInput
      | Prisma.DevotionOrderByWithRelationInput;
    include?: Prisma.DevotionInclude;
  }

  interface GetDevotionOptions {
    throwOnNotFound?: boolean;
    include?: Prisma.DevotionInclude;
  }
}
