import { Prisma } from "@prisma/client";

export declare module "index-op" {
  interface GetIndexOperationsOptions {
    query?: Prisma.IndexOperationWhereInput;
    limit?: number;
    offset?: number;
    orderBy?:
      | Prisma.IndexOperationOrderByWithAggregationInput
      | Prisma.IndexOperationOrderByWithRelationInput;
  }

  interface GetIndexOperationOptions {
    throwOnNotFound?: boolean;
  }
}
