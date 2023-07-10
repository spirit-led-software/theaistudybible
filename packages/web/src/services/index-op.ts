import { IndexOperation, Prisma } from "@prisma/client";
import { prisma } from "@services/database";

type GetIndexOperationsOptions = {
  query?: Prisma.IndexOperationWhereInput;
  limit?: number;
  offset?: number;
  orderBy?:
    | Prisma.IndexOperationOrderByWithAggregationInput
    | Prisma.IndexOperationOrderByWithRelationInput;
};

export async function getIndexOperations(
  options?: GetIndexOperationsOptions
): Promise<IndexOperation[]> {
  const {
    query,
    limit = 25,
    offset = 0,
    orderBy = {
      createdAt: "desc",
    },
  } = options ?? {};

  const indexOperations = await prisma.indexOperation.findMany({
    where: query,
    take: limit,
    skip: offset,
    orderBy,
  });

  return indexOperations;
}

type GetIndexOperationOptions = {
  throwOnNotFound?: boolean;
};

export async function getIndexOperation(
  id: string,
  options?: GetIndexOperationOptions
): Promise<IndexOperation | null> {
  const { throwOnNotFound = false } = options ?? {};

  let indexOperation: IndexOperation | null = null;
  if (throwOnNotFound) {
    indexOperation = await prisma.indexOperation.findUniqueOrThrow({
      where: {
        id,
      },
    });
  } else {
    indexOperation = await prisma.indexOperation.findUnique({
      where: {
        id,
      },
    });
  }

  return indexOperation;
}

export async function createIndexOperation(
  data: Prisma.IndexOperationCreateInput
): Promise<IndexOperation> {
  const indexOperation = await prisma.indexOperation.create({
    data,
  });

  return indexOperation;
}

export async function updateIndexOperation(
  id: string,
  data: Prisma.IndexOperationUpdateInput
): Promise<IndexOperation> {
  const indexOperation = await prisma.indexOperation.update({
    where: {
      id,
    },
    data,
  });

  return indexOperation;
}

export async function deleteIndexOperation(id: string): Promise<void> {
  const indexOperation = await prisma.indexOperation.findUniqueOrThrow({
    where: {
      id,
    },
  });
  await prisma.indexOperation.delete({
    where: {
      id: indexOperation.id,
    },
  });
}
