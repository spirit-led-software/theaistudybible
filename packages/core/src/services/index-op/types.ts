import { Prisma } from "@prisma/client";

export type GetIndexOperationsOptions = {
  query?: Prisma.IndexOperationWhereInput;
  limit?: number;
  offset?: number;
  orderBy?:
    | Prisma.IndexOperationOrderByWithAggregationInput
    | Prisma.IndexOperationOrderByWithRelationInput;
};

export type GetIndexOperationOptions = {
  throwOnNotFound?: boolean;
};
