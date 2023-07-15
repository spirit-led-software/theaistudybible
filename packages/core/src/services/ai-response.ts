import { Prisma } from "@prisma/client";
import { GetAiResponseOptions, GetAiResponsesOptions } from "ai-response";
import { prisma } from "./database";

export async function getAiResponses(options?: GetAiResponsesOptions) {
  const {
    query,
    limit = 25,
    offset = 0,
    orderBy = {
      createdAt: "desc",
    },
    include,
  } = options ?? {};

  return await prisma.aiResponse.findMany({
    where: query,
    take: limit,
    skip: offset,
    orderBy,
    include,
  });
}

export async function getAiResponse(
  id: string,
  options?: GetAiResponseOptions
) {
  const { throwOnNotFound = false, include } = options ?? {};

  if (throwOnNotFound) {
    return prisma.aiResponse.findUniqueOrThrow({
      where: {
        id,
      },
      include,
    });
  }

  return await prisma.aiResponse.findUnique({
    where: {
      id,
    },
  });
}

export async function createAiResponse(data: Prisma.AiResponseCreateInput) {
  return await prisma.aiResponse.create({
    data,
  });
}

export async function updateAiResponse(
  id: string,
  data: Prisma.AiResponseUpdateInput
) {
  return await prisma.aiResponse.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteAiResponse(id: string): Promise<void> {
  const aiResponse = await prisma.aiResponse.findUniqueOrThrow({
    where: {
      id,
    },
  });

  await prisma.aiResponse.delete({
    where: {
      id: aiResponse.id,
    },
  });
}
