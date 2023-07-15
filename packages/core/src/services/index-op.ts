import { Prisma } from "@prisma/client";
import { GetIndexOperationOptions, GetIndexOperationsOptions } from "index-op";
import { prisma } from "./database";

export async function getIndexOperations(options?: GetIndexOperationsOptions) {
  const {
    query,
    limit = 25,
    offset = 0,
    orderBy = {
      createdAt: "desc",
    },
  } = options ?? {};

  return await prisma.indexOperation.findMany({
    where: query,
    take: limit,
    skip: offset,
    orderBy,
  });
}

export async function getIndexOperation(
  id: string,
  options?: GetIndexOperationOptions
) {
  const { throwOnNotFound = false } = options ?? {};

  if (throwOnNotFound) {
    return await prisma.indexOperation.findUniqueOrThrow({
      where: {
        id,
      },
    });
  }

  return await prisma.indexOperation.findUnique({
    where: {
      id,
    },
  });
}

export async function createIndexOperation(
  data: Prisma.IndexOperationCreateInput
) {
  return await prisma.indexOperation.create({
    data,
  });
}

export async function updateIndexOperation(
  id: string,
  data: Prisma.IndexOperationUpdateInput
) {
  return await prisma.indexOperation.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteIndexOperation(id: string) {
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
